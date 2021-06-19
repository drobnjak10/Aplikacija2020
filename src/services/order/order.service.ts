import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from 'src/entities/cart.entity';
import { CartArticle } from 'src/entities/cart-article.entity';
import { Article } from 'src/entities/article.entity';
import { Order } from 'src/entities/order.entity';
import { ApiResponse } from 'src/misc/api.response.class';
import { ChangeOrderStatusDto } from 'src/dtos/order/change.order.status.dto';

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly order: Repository<Order>,
        @InjectRepository(Cart) 
        private readonly cart: Repository<Cart>,
    ) { }

    async add(cartId: number): Promise<Order | ApiResponse> {
        const order = await this.order.findOne({
            cartId: cartId
        });

        if(order) {
            return new ApiResponse('error', -7001, "An order for this cart has already been made.");
        }

        const cart = await this.cart.findOne(cartId, {
            relations: [
                "cartArticles",
            ]
        });

        if(!cart) {
            return new ApiResponse('error', -7002, "No such cart found.");
        }

        if(cart.cartArticles.length === 0) {
            return new ApiResponse('error', -7003, "This cart is empty.");
        }

        const newOrder: Order = new Order();
        newOrder.cartId = cartId;

        const savedOrder = await this.order.save(newOrder);

        return await this.getById(savedOrder.orderId);
        
    }
    
    async getById(id: number): Promise<Order> {
        return await this.order.findOne(id, {
            relations: [
                "cart",
                "cart.user",
                "cart.cartArticles",
                "cart.cartArticles.article",
                "cart.cartArticles.article.category",
                "cart.cartArticles.article.articlePrices"
            ]
        });  
    }

    async changeStatus(id: number, newStatus: "rejected" | "accepted" | "shipped" | "pending") {
        const order = await this.getById(id);

        if(!order) {
            return new ApiResponse('error', -9002, 'Cannnot change order status.');
        }
        
        order.status = newStatus;

        await this.order.save(order);
        
        return await this.getById(id);
    }
    
}
