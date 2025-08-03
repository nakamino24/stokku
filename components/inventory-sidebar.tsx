"use client"

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

interface InventorySidebarProps {
  currentView: string
  onViewChange: (view: string) => void
  products: any[]
}

export function InventorySidebar({ currentView, onViewChange, products }: InventorySidebarProps) {
  const lowStockCount = products.filter((p) => p.status === "Low Stock").length
  const outOfStockCount = products.filter((p) => p.status === "Out of Stock").length

  const mainMenuItems = [
    {
      title: "Dashboard",
      url: "dashboard",
      icon: Home,
    },
    {
      title: "All Products",
      url: "all-products",
      icon: Package,
      badge: products.length,
    },
    {
      title: "Low Stock",
      url: "low-stock",
      icon: TrendingDown,
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

  const reportsItems = [
    {
      title: "Sales Report",
      url: "sales-report",
      icon: BarChart3,
    },
    {
      title: "Stock Movement",
      url: "stock-movement",
      icon: TrendingUp,
    },
    {
      title: "Supplier Report",
      url: "supplier-report",
      icon: Users,
    },
  ]

  const actionsItems = [
    {
      title: "Add Product",
      url: "add-product",
      icon: Plus,
    },
    {
      title: "Import Data",
      url: "import-data",
      icon: FileText,
    },
    {
      title: "Export Data",
      url: "export-data",
      icon: Download,
    },
  ]

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Package className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">StockMaster</span>
                <span className="truncate text-xs">Inventory Management</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Inventory</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.url)}
                    isActive={currentView === item.url}
                    className="w-full"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                    {item.badge !== undefined && (
                      <Badge variant={item.badgeVariant || "secondary"} className="ml-auto h-5 w-auto px-1.5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={() => onViewChange(item.url)} isActive={currentView === item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={() => onViewChange(item.url)} isActive={currentView === item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
