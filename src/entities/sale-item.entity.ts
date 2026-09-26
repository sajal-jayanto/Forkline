import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { OutletMenuItem } from "./outlet-menu-item.entity.js";
import { Sale } from "./sale.entity.js";

export interface SaleItemDto {
  saleId: number,
  outletMenuItemId: number,
  quantity: number,
  unitPrice: string,
  subtotal: string,
}

@Entity({ name: "sale_items" })
@Unique("uq_sale_item", ["saleId", "outletMenuItemId"])
export class SaleItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "sale_id", type: "int" })
  saleId!: number;

  @Column({ name: "outlet_menu_item_id", type: "int" })
  outletMenuItemId!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ name: "unit_price", type: "numeric", precision: 10, scale: 2 })
  unitPrice!: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  subtotal!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  @ManyToOne(() => Sale, (sale) => sale.saleItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sale_id" })
  sale!: Relation<Sale>;

  @ManyToOne(() => OutletMenuItem, (outletMenuItem) => outletMenuItem.saleItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "outlet_menu_item_id" })
  outletMenuItem!: Relation<OutletMenuItem>;
}
