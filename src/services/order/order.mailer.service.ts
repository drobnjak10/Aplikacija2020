import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { MailConfig } from "config/mail.config";
import { CartArticle } from "src/entities/cart-article.entity";
import { Order } from "src/entities/order.entity";

@Injectable()
export class OrderMailer {
    constructor(private readonly mailerService: MailerService) {}

    async sendOrderEmail(order: Order) {
        await this.mailerService.sendMail({
            to: order.cart.user.email,
            bcc: MailConfig.orderNotificationMail,
            subject: 'Order details',
            encoding: 'UTF-8',
            // from: 'no-replay@domain.com'
            html: this.makeOrderHtml(order)
        })
    }

    private makeOrderHtml(order: Order): string {
        let suma = order.cart.cartArticles.reduce((sum, currentCartArticle: CartArticle) => {
            return sum + currentCartArticle.quantity * currentCartArticle.article.articlePrices[currentCartArticle.article.articlePrices.length - 1].price;
        }, 0)
        
        return `<p>Zahvaljujemo se na Vasoj porudzbini!</p>
                <p>Ovo su detalji Vase porudzbine:</p>
                <ul>
                    ${ order.cart.cartArticles.map((cartArticle: CartArticle) => {
                        return `<li>
                            ${ cartArticle.article.name } x
                            ${ cartArticle.quantity }
                        </li>`;
                    }) }
                </ul>
                <p>Ukupan iznos je: ${ suma } EUR.</p>
                <p>Potpis...</p>
                `;
    }
}