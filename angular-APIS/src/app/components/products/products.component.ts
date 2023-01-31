import { Component, OnInit } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { zip } from 'rxjs';
//Interfaz de producto
import { Product, CreateProductDTO, UpdateProductDTO } from '../../models/product.model';
//Servicios
import { StoreService } from '../../services/store.service';
import { ProductsService } from '../../services/products.service';
// librería llamada SweetAlert2. para utilizar aviso.
import Swal from 'sweetalert2';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  myShoppingCart: Product[] = [];
  total = 0;
  products: Product[] = [];
  showProductDetail = false;
  productChosen: Product = {
    id: '',
    price: 0,
    images: [],
    title: '',
    category: {
      id: '',
      name: ''
    },
    description: ''
  };
  limit = 10;
  offset = 0;
  statusDetail: 'loading' | 'success' | 'error' | 'init' = 'init';

  constructor(
    private storeService: StoreService,
    private productsService: ProductsService
  ) {
    this.myShoppingCart = this.storeService.getShoppingCart();
  }

  ngOnInit(): void {
    // this.loadMore();

    this.productsService.getAllProducts(10, 0)
    .subscribe(data => {
      this.products = data;
      this.offset += this.limit;
    });
  }

  onAddToShoppingCart(product: Product) {
    this.storeService.addProduct(product);
    this.total = this.storeService.getTotal();
  }

  toggleProductDetail() {
    this.showProductDetail = !this.showProductDetail;
  }

  onShowDetail(id: string) {
    this.statusDetail = 'loading';
    this.toggleProductDetail();
    this.productsService.getProduct(id).subscribe(data => {

      // console.log('product',data);Para observar la info de la data

      // this.toggleProductDetail();
      this.productChosen = data;
      this.statusDetail = 'success';
    }, errorMsg => {
      // window.alert(errorMsg);
      Swal.fire({
        title: 'Error !',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: 'Close'
      })
      this.statusDetail = 'error';

      //Otras maneras de observar el error

      // response => {
      //   console.log(response.error.message);

      // error => {
      //   console.error(error);
    })
  }

  readAndUpdate(id: string) {
    // Aqui se puede observar un Callback hell con el uso de observadores de Angular al tener varios subscribe anidados

    // this.productsService.getProduct(id)
    // .subscribe(data => {
    //   const product = data;
    //   this.productsService.update(product.id, {title: 'change'})
    //   .subscribe(rtaUpdate => {
    //     console.log(rtaUpdate);
    //   })
    // })

    // Para evitarlo se usa la instruccion de rxjs/operators el operador:switchMap Que simula la accion del .then para hacerlo con las promesas
    // Siempre y cuando halla dependencia es decir que halla un dato anterior
    this.productsService.getProduct(id)
    .pipe(
      switchMap((product) => {
        return this.productsService.update(product.id, {title: 'change'});
      })
    )
    .subscribe(data => {
      console.log(data);
    });

    // cuando no hay dependencias se usa de rxjs a: zip y cuando se hace subscribe se obtienen las respuestas
    // se obtiene la respuesta como un array y se accede atravez del index
    // es decir en response se obtienen todas las respuestas al tiempo
    zip(
      this.productsService.getProduct(id),
      this.productsService.update(id, {title: 'nuevo'})
    )
    .subscribe(response => {
      const read = response[0];
      const update = response[1];
    })
  }

  createNewProduct() {
    const product: CreateProductDTO = {
      title: 'Nuevo Producto',
      description: 'Bla blablablabla bla bla',
      images: [
        `https://placeimg.com/640/480/any?random=${Math.random()}`,
        `https://placeimg.com/640/480/any?random=${Math.random()}`,
        `https://placeimg.com/640/480/any?random=${Math.random()}`],
      price: 17700,
      categoryId: 2
    }
    this.productsService.create(product).subscribe(data => {
      // console.log('created', data);
      this.products.unshift(data);
    });
  }

  updateProduct() {
    const changes: UpdateProductDTO = {
      title: 'Nuevo Titulo'
    }
    const id = this.productChosen.id;
    this.productsService.update(id, changes).subscribe(data => {
      // console.log('update', data);
      const productIndex = this.products.findIndex(item => item.id === this.productChosen.id);
      this.products[productIndex] = data;
      this.productChosen = data;
    })
  }

  deleteProduct() {
    const id = this.productChosen.id;
    this.productsService.delete(id).subscribe(data => {
      const productIndex = this.products.findIndex(item => item.id === this.productChosen.id);
      this.products.splice(productIndex, 1);
      this.showProductDetail = false;
    });
  }

  loadMore() {
    this.productsService.getAllProducts(this.limit, this.offset)
    .subscribe(data => {
      this.products = this.products.concat(data);
      this.offset += this.limit;
    });
  }
}
