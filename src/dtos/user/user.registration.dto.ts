import * as Validator from "class-validator"

export class UserRegistrationDto {
    @Validator.IsNotEmpty()
    @Validator.IsEmail({
        allow_ip_domain: false,
        allow_utf8_local_part: true,
        require_tld: true   
    })
    email: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(6, 128)
    password: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Matches(/^[A-Z][a-z]{1,31}$/)
    forename: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(2,64)
    @Validator.Matches(/^[A-Z][a-z]{1,31}$/)

    surname: string;

    @Validator.IsNotEmpty()
    @Validator.IsPhoneNumber(null) // +381...
    phoneNumber: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(10, 512)
    postalAddress: string;
}