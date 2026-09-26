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
import { Sale } from "./sale.entity.js";

export interface OutletDto {
  name: string;
  slug?: string;
  description?: string;
  location?: string;
  isActive?: boolean;
}

@Entity({ name: "outlets" })
export class Outlet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  location!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt!: Date;

  @OneToMany(() => OutletMenuItem, (outletMenuItem) => outletMenuItem.outlet)
  outletMenuItems!: Relation<OutletMenuItem[]>;

  @OneToMany(() => Sale, (sale) => sale.outlet)
  sales!: Relation<Sale[]>;
}
