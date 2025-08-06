'use client'

import { useState } from 'react'
import { ImportExportManager } from '@/components/features/common/ImportExportManager'
import { sampleProducts } from '@/lib/sample-data'

export default function ImportExportPage() {
  const [products, setProducts] = useState(sampleProducts)

  const handleImport = (importedProducts: any[]) => {
    setProducts(prev => [...prev, ...importedProducts])
  }

  return (
    <div className="container mx-auto p-6">
      <ImportExportManager 
        products={products}
        onImport={handleImport}
      />
    </div>
  )
}
