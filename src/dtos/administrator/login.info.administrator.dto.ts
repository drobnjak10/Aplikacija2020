export class LoginInfoAdministratorDto {
    administratorId: number;
    username: string;
    token: string;

    constructor(id: number, username: string, token: string) {
        this.administratorId = id;
        this.username = username;
        this.token = token;
    }
}