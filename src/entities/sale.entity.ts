import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { Outlet } from "./outlet.entity.js";
import { SaleItem } from "./sale-item.entity.js";

@Entity({ name: "sales" })
@Unique("uq_outlet_receipt", ["outletId", "receiptNumber"])
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "outlet_id", type: "int" })
  outletId!: number;

  @Column({ name: "receipt_number", type: "int" })
  receiptNumber!: number;

  @Column({ name: "tax_amount", type: "numeric", precision: 10, scale: 2, default: 0 })
  taxAmount!: string;

  @Column({ name: "total_amount", type: "numeric", precision: 10, scale: 2 })
  totalAmount!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  @ManyToOne(() => Outlet, (outlet) => outlet.sales, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "outlet_id" })
  outlet!: Relation<Outlet>;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale)
  saleItems!: Relation<SaleItem[]>;
}
