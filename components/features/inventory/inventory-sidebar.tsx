"use client"

import { useState } from "react"
import {
  Archive,
  BarChart3,
  Download,
  FileText,
  Home,
  Package,
  Plus,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Product } from "@/types/product.types";

interface InventorySidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  products: Product[];
  onAddProduct: () => void;
  onFindProduct?: () => void;
}

const CollapsibleSidebarGroup = ({
  label,
  items,
  currentView,
  onViewChange,
  defaultOpen = true,
}: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-2 text-sm font-semibold"
        >
          {label}
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenu>
          {items.map((item: any) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => onViewChange(item.url)}
                isActive={currentView === item.url}
                className="w-full"
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
                {item.badge !== undefined && (
                  <Badge
                    variant={item.badgeVariant || "secondary"}
                    className="ml-auto h-5 w-auto px-1.5 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function InventorySidebar({
  currentView,
  onViewChange,
  products,
  onAddProduct,
  onFindProduct,
}: InventorySidebarProps) {
  const lowStockCount = products.filter((p) => p.status === "Low Stock").length
  const outOfStockCount = products.filter((p) => p.status === "Out of Stock").length

  const mainViews = [
    { title: "Dashboard", url: "dashboard", icon: Home },
    { title: "All Products", url: "all-products", icon: Package, badge: products.length },
  ]

  const productFilters = [
    {
      title: "Low Stock",
      url: "low-stock",
      icon: AlertTriangle,
      badge: lowStockCount,
      badgeVariant: "destructive" as const,
    },
    {
      title: "Out of Stock",
      url: "out-of-stock",
      icon: Archive,
      badge: outOfStockCount,
      badgeVariant: "destructive" as const,
    },
  ]

  const reports = [
    { title: "Sales Report", url: "sales-report", icon: BarChart3 },
    { title: "Stock Movement", url: "stock-movement", icon: TrendingUp },
    { title: "Supplier Report", url: "supplier-report", icon: Users },
  ]

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              onClick={() => window.location.href = '/'}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Stokku</span>
                <span className="truncate text-xs">Inventory Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-4">
        {/* Main Views */}
        <SidebarMenu>
          {mainViews.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => onViewChange(item.url)}
                isActive={currentView === item.url}
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
                {item.badge !== undefined && (
                  <Badge variant="secondary" className="ml-auto h-5 w-auto px-1.5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator />

        {/* Quick Actions */}
        <div className="px-3 space-y-2">
          <h3 className="text-sm font-semibold px-2">Quick Actions</h3>
          <Button size="sm" className="w-full" onClick={onAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button size="sm" variant="outline" className="w-full" onClick={() => onViewChange('find-product')}>
            <Search className="h-4 w-4 mr-2" />
            Find Product
          </Button>
        </div>

        <SidebarSeparator />

        {/* Filters and Reports */}
        <CollapsibleSidebarGroup
          label="Filters"
          items={productFilters}
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <CollapsibleSidebarGroup
          label="Reports"
          items={reports}
          currentView={currentView}
          onViewChange={onViewChange}
        />
        
        <SidebarSeparator />

        {/* Data Management */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onViewChange("import-data")}>
              <Download className="size-4" />
              <span>Import/Export</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => onViewChange("settings")} isActive={currentView === "settings"}>
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
