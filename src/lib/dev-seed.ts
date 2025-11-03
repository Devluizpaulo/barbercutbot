import { Firestore, collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'

export async function seedDemoData(db: Firestore, shopId: string) {
  if (!db || !shopId) return
  if (process.env.NODE_ENV === 'production') return

  const now = new Date()

  const servicesCol = collection(db, 'barberShops', shopId, 'services')
  const customersCol = collection(db, 'barberShops', shopId, 'customers')
  const barbersCol = collection(db, 'barberShops', shopId, 'barbers')
  const appointmentsCol = collection(db, 'barberShops', shopId, 'appointments')
  const financialCol = collection(db, 'barberShops', shopId, 'financialRecords')

  const [svcCut, svcBeard] = await Promise.all([
    addDoc(servicesCol, { name: 'Corte Masculino', price: 50, duration: 40, ativo: true }),
    addDoc(servicesCol, { name: 'Barba', price: 35, duration: 25, ativo: true }),
  ])

  const [cust1] = await Promise.all([
    addDoc(customersCol, { firstName: 'Cliente', lastName: 'Demo', phone: '(11) 99999-0000', createdAt: serverTimestamp() }),
  ])

  const [barb1] = await Promise.all([
    addDoc(barbersCol, { firstName: 'João', lastName: 'Barbeiro', email: 'joao@example.com', createdAt: serverTimestamp() }),
  ])

  const startDate = new Date(now)
  startDate.setHours(14, 0, 0, 0)

  await addDoc(appointmentsCol, {
    customerId: cust1.id,
    barberId: barb1.id,
    items: [
      { serviceId: svcCut.id, price: 50 },
      { serviceId: svcBeard.id, price: 35 },
    ],
    totalPrice: 85,
    status: 'confirmed',
    startTime: Timestamp.fromDate(startDate),
    createdAt: serverTimestamp(),
  })

  await addDoc(financialCol, {
    type: 'income',
    amount: 85,
    date: Timestamp.fromDate(now),
    items: [
      { barberId: barb1.id, serviceId: svcCut.id, price: 50 },
      { barberId: barb1.id, serviceId: svcBeard.id, price: 35 },
    ],
    paymentMethod: 'cash',
    createdAt: serverTimestamp(),
  })
}
