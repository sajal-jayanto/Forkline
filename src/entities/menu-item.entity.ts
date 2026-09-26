import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";
import { OutletMenuItem } from "./outlet-menu-item.entity.js";

export interface MenuItemDto {
  name: string;
  description?: string;
  slug?: string; 
  imageUrl: string;
  masterPrice: string;
  isActive?: boolean;
}

@Entity({ name: "menu_items" })
export class MenuItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: "master_price", type: "numeric", precision: 10, scale: 2 })
  masterPrice!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => OutletMenuItem, (outletMenuItem) => outletMenuItem.menuItem)
  outletMenuItems!: Relation<OutletMenuItem[]>;
}
