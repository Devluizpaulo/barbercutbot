'use client'

import React from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'

export function AnnualBarChart({ data }: { data: Array<{ month: string; income: number; expense: number; projectedIncome: number; projectedExpense: number }> }) {
  return (
    <ChartContainer config={{}} className="w-full h-[250px]">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickFormatter={(value) => `R$${value / 1000}k`} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} name="Receita Realizada" />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} name="Despesa Realizada" />
        <Bar dataKey="projectedIncome" fill="var(--color-income)" radius={4} fillOpacity={0.4} name="Receita Projetada" />
        <Bar dataKey="projectedExpense" fill="var(--color-expense)" radius={4} fillOpacity={0.4} name="Despesa Projetada" />
      </BarChart>
    </ChartContainer>
  )
}

export function PieRevenueByBarber({ data, colors }: { data: Array<{ name: string; revenue: number }>; colors: string[] }) {
  return (
    <ChartContainer config={{}} className="w-full h-[250px]">
      <PieChart>
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie data={data} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

export function PieRevenueByPayment({ data, colors }: { data: Array<{ method: string; revenue: number }>; colors: string[] }) {
  return (
    <ChartContainer config={{}} className="w-full h-[250px]">
      <PieChart>
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Pie data={data} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
