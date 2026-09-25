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
import { MenuItem } from "./menu-item.entity.js";
import { Outlet } from "./outlet.entity.js";
import { SaleItem } from "./sale-item.entity.js";

@Entity({ name: "outlet_menu_items" })
@Unique("uq_outlet_menu_item", ["outletId", "menuItemId"])
export class OutletMenuItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "outlet_id", type: "int" })
  outletId!: number;

  @Column({ name: "menu_item_id", type: "int" })
  menuItemId!: number;

  @Column({ name: "price_override", type: "numeric", precision: 10, scale: 2, nullable: true })
  priceOverride!: string | null;

  @Column({ name: "available_unit", type: "int", default: 0 })
  availableUnit!: number;

  @Column({ name: "is_available", type: "boolean", default: true })
  isAvailable!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  @ManyToOne(() => Outlet, (outlet) => outlet.outletMenuItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "outlet_id" })
  outlet!: Relation<Outlet>;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.outletMenuItems, { onDelete: "CASCADE" })
  @JoinColumn({ name: "menu_item_id" })
  menuItem!: Relation<MenuItem>;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.outletMenuItem)
  saleItems!: Relation<SaleItem[]>;
}
