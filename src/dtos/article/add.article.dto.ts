export class AddArticleDto {
    name: string;
    categoryId: number;
    excerpt: string;
    description: string;
    price: number;
    features: {
        featureId: number,
        value: string
    }[];
}

// {
//     "name": "ACME SDD HD11 1TB",
//     "categoryId": 5,
//     "excerpt": "Kratak opis proizvoda",
//     "description": "Detaljan opis proizvoda",
//     "price": 56.78,
//     "features": {
//         "1": "1TB",
//         "3": "SDD"
//     },
//     "photos": [
//         "base64slika1...",
//         "base64slika2...",
//         "base64slika3..."
//     ]
// }