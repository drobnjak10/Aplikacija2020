import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Cart } from "./cart.entity";
import * as Validator from "class-validator"

@Index("uq_user_email", ["email"], { unique: true })
@Index("uq_user_phone_number", ["phoneNumber"], { unique: true })
@Entity("user")
export class User {
  @PrimaryGeneratedColumn({ type: "int", name: "user_id", unsigned: true })
  userId: number;

  @Column("varchar", {
    unique: true,
    length: 255,
    default: () => "'0'",
  })
  @Validator.IsNotEmpty()
  @Validator.IsEmail({
    allow_ip_domain: false,
    allow_utf8_local_part: true,
    require_tld: true   
  })
  email: string;

  @Column("varchar", {
    name: "password_hash",
    length: 128,
    default: () => "'0'",
  })
  @Validator.IsNotEmpty()
  @Validator.IsHash('sha512')
  passwordHash: string;

  @Column("varchar", { length: 64, default: () => "'0'" })
  @Validator.IsNotEmpty()
  @Validator.IsString()
  @Validator.Matches(/^[A-Z][a-z]{1,31}$/, {
    message: "Forename is not valid."
  })
  forename: string;

  @Column("varchar", { length: 64, default: () => "'0'" })
  @Validator.IsNotEmpty()
  @Validator.IsString()
  @Validator.Length(2,64)
  @Validator.Matches(/^[A-Z][a-z]{1,31}$/, {
    message: "Surname is not valid."
  })
  surname: string;

  @Column("varchar", {
    name: "phone_number",
    unique: true,
    length: 24,
    default: () => "'0'",
  })
  @Validator.IsNotEmpty()
  @Validator.IsPhoneNumber(null) // +381...
  phoneNumber: string;

  @Column("tinytext", { name: "postal_address" })
  @Validator.IsNotEmpty()
  @Validator.IsString()
  @Validator.Length(10, 512)
  postalAddress: string;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];
}
