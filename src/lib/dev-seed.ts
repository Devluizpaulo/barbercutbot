
import { Firestore, collection, addDoc, serverTimestamp, Timestamp, writeBatch, getDocs, query, limit } from 'firebase/firestore'
import { subDays, addDays, setHours, startOfHour } from 'date-fns';

/**
 * Checks if a collection has documents.
 * @param db Firestore instance.
 * @param collectionPath Path to the collection.
 * @returns True if the collection has documents, false otherwise.
 */
async function collectionHasData(db: Firestore, collectionPath: string): Promise<boolean> {
    const collectionRef = collection(db, collectionPath);
    const q = query(collectionRef, limit(1));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}


export async function seedDemoData(db: Firestore, shopId: string) {
  if (!db || !shopId) {
      console.error("Firestore instance or Shop ID is missing.");
      return;
  }
  if (process.env.NODE_ENV === 'production') {
      console.warn("Seed data is disabled in production.");
      return;
  }
  
  // Check if collections already have data
  const hasServices = await collectionHasData(db, `barberShops/${shopId}/services`);
  if (hasServices) {
      console.log("Seed data already exists. Aborting.");
      return;
  }

  const batch = writeBatch(db);
  const now = new Date();

  // --- COLLECTIONS ---
  const servicesCol = collection(db, 'barberShops', shopId, 'services');
  const customersCol = collection(db, 'barberShops', shopId, 'customers');
  const barbersCol = collection(db, 'barberShops', shopId, 'barbers');
  const appointmentsCol = collection(db, 'barberShops', shopId, 'appointments');
  const financialCol = collection(db, 'barberShops', shopId, 'financialRecords');
  const productsCol = collection(db, 'barberShops', shopId, 'products');
  const suppliersCol = collection(db, 'barberShops', shopId, 'suppliers');

  // --- DATA CREATION ---

  // 1. Services
  const serviceData = [
    { name: 'Corte Masculino', price: 50, duration: 40, ativo: true, cost: 5, partnership: { isCommissionEnabled: true, commissionType: 'percentage', commissionValue: 50 } },
    { name: 'Barba Terapia', price: 45, duration: 30, ativo: true, cost: 8, partnership: { isCommissionEnabled: true, commissionType: 'percentage', commissionValue: 50 } },
    { name: 'Corte e Barba', price: 90, duration: 70, ativo: true, cost: 10, partnership: { isCommissionEnabled: true, commissionType: 'percentage', commissionValue: 50 } },
    { name: 'Pezinho (Acabamento)', price: 20, duration: 15, ativo: true, cost: 2, partnership: { isCommissionEnabled: true, commissionType: 'percentage', commissionValue: 40 } },
    { name: 'Hidratação Capilar', price: 60, duration: 45, ativo: false, cost: 15, partnership: { isCommissionEnabled: true, commissionType: 'fixed', commissionValue: 20 } },
  ];
  const serviceIds = serviceData.map(s => {
    const docRef = collection(db, `barberShops/${shopId}/services`).doc();
    batch.set(docRef, { ...s, id: docRef.id, barberShopId: shopId, createdAt: serverTimestamp() });
    return { id: docRef.id, ...s };
  });

  // 2. Barbers
  const barberData = [
    { firstName: 'Rodrigo', lastName: 'Alves', email: 'rodrigo@email.com', color: '#3b82f6', services: [
        { serviceId: serviceIds[0].id, commissionType: 'percentage', commissionValue: 50},
        { serviceId: serviceIds[1].id, commissionType: 'percentage', commissionValue: 50},
        { serviceId: serviceIds[2].id, commissionType: 'percentage', commissionValue: 50},
    ]},
    { firstName: 'Carlos', lastName: 'Pereira', email: 'carlos@email.com', color: '#16a34a', services: [
        { serviceId: serviceIds[0].id, commissionType: 'percentage', commissionValue: 45},
        { serviceId: serviceIds[1].id, commissionType: 'percentage', commissionValue: 45},
    ]},
    { firstName: 'Miguel', lastName: 'Andrade', email: 'miguel@email.com', color: '#f97316', services: [
        { serviceId: serviceIds[3].id, commissionType: 'fixed', commissionValue: 10},
    ]},
  ];
   const barberIds = barberData.map(b => {
    const docRef = collection(db, `barberShops/${shopId}/barbers`).doc();
    batch.set(docRef, { ...b, id: docRef.id, barberShopId: shopId, createdAt: serverTimestamp() });
    return { id: docRef.id, ...b };
  });

  // 3. Customers
  const customerData = [
      { firstName: 'Lucas', lastName: 'Moura', phone: '(11) 98765-4321', email: 'lucas.moura@example.com' },
      { firstName: 'Mariana', lastName: 'Costa', phone: '(21) 99887-6543', email: 'mariana.costa@example.com' },
      { firstName: 'Pedro', lastName: 'Henrique', phone: '(31) 98888-1234', email: 'pedro.h@example.com' },
  ];
   const customerIds = customerData.map(c => {
    const docRef = collection(db, `barberShops/${shopId}/customers`).doc();
    batch.set(docRef, { ...c, id: docRef.id, barberShopId: shopId, createdAt: serverTimestamp() });
    return { id: docRef.id, ...c };
  });

  // 4. Appointments & Corresponding Financial Records
  const appointmentsData = [
    // Completed Today
    { date: now, hour: 9, barber: barberIds[0], customer: customerIds[0], service: serviceIds[0], status: 'completed' },
    { date: now, hour: 10, barber: barberIds[1], customer: customerIds[1], service: serviceIds[1], status: 'completed' },
    // Confirmed Today
    { date: now, hour: 14, barber: barberIds[0], customer: customerIds[2], service: serviceIds[2], status: 'confirmed' },
    // Confirmed Tomorrow
    { date: addDays(now, 1), hour: 11, barber: barberIds[1], customer: customerIds[0], service: serviceIds[0], status: 'confirmed' },
    // Cancelled Yesterday
    { date: subDays(now, 1), hour: 16, barber: barberIds[0], customer: customerIds[1], service: serviceIds[1], status: 'cancelled' },
    // No-show Yesterday
    { date: subDays(now, 1), hour: 18, barber: barberIds[1], customer: customerIds[2], service: serviceIds[0], status: 'no-show' },
     // Completed last month
    { date: subDays(now, 30), hour: 15, barber: barberIds[0], customer: customerIds[2], service: serviceIds[2], status: 'completed' },
  ];

  appointmentsData.forEach(appt => {
    const appointmentDocRef = collection(db, `barberShops/${shopId}/appointments`).doc();
    const startTime = startOfHour(setHours(appt.date, appt.hour));
    const appointmentPayload = {
      id: appointmentDocRef.id,
      barberShopId: shopId,
      customerId: appt.customer.id,
      items: [{ serviceId: appt.service.id, barberId: appt.barber.id, price: appt.service.price, duration: appt.service.duration }],
      totalPrice: appt.service.price,
      totalDuration: appt.service.duration,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(addDays(startTime, appt.service.duration)),
      status: appt.status,
      createdAt: serverTimestamp(),
    };
    batch.set(appointmentDocRef, appointmentPayload);

    if (appt.status === 'completed') {
      const financialDocRef = collection(db, `barberShops/${shopId}/financialRecords`).doc();
      batch.set(financialDocRef, {
        id: financialDocRef.id,
        barberShopId: shopId,
        date: appointmentPayload.startTime,
        type: 'income',
        description: `Serviço: ${appt.service.name}`,
        amount: appt.service.price,
        category: 'Venda de Serviço',
        paymentMethod: ['Dinheiro', 'Pix', 'Crédito'][Math.floor(Math.random() * 3)],
        appointmentId: appointmentDocRef.id,
        items: [{
          id: appt.service.id,
          name: appt.service.name,
          price: appt.service.price,
          quantity: 1,
          type: 'service',
          barberId: appt.barber.id,
        }],
        createdAt: serverTimestamp(),
      });
    }
  });
  
  // 5. Products & Suppliers
  const supplierDocRef = collection(db, `barberShops/${shopId}/suppliers`).doc();
  batch.set(supplierDocRef, {
      id: supplierDocRef.id,
      barberShopId: shopId,
      name: 'Fornecedor de Cosméticos ABC',
      contactPerson: 'Sr. Silva',
      phone: '(11) 5555-4444',
      category: 'Cosméticos',
      createdAt: serverTimestamp(),
  });

  const productData = [
      { name: 'Pomada Modeladora Efeito Seco', price: 65, cost: 30, stockQuantity: 25, sku: 'POM-001', ativo: true },
      { name: 'Óleo para Barba', price: 45, cost: 20, stockQuantity: 15, sku: 'OIL-002', ativo: true },
      { name: 'Shampoo Anti-Queda', price: 80, cost: 45, stockQuantity: 8, sku: 'SHP-003', ativo: true },
  ];
   productData.forEach(p => {
    const docRef = collection(db, `barberShops/${shopId}/products`).doc();
    batch.set(docRef, { ...p, id: docRef.id, barberShopId: shopId, createdAt: serverTimestamp() });
  });

  // 6. Extra Financial Records (Expenses)
   const expenseData = [
       { description: 'Aluguel do Mês', amount: 2500, category: 'Aluguel', isRecurring: true, date: startOfHour(setHours(subDays(now, 15), 10)) },
       { description: 'Conta de Energia', amount: 450.70, category: 'Contas (Água, Luz, etc.)', isRecurring: true, date: startOfHour(setHours(subDays(now, 10), 10)) },
       { description: 'Compra de Produtos', amount: 850, category: 'Fornecedores', isRecurring: false, date: startOfHour(setHours(subDays(now, 5), 10)) },
   ];
    expenseData.forEach(e => {
    const docRef = collection(db, `barberShops/${shopId}/financialRecords`).doc();
    batch.set(docRef, {
        ...e,
        id: docRef.id,
        barberShopId: shopId,
        type: 'expense',
        date: Timestamp.fromDate(e.date),
        createdAt: serverTimestamp(),
    });
  });

  try {
    await batch.commit();
    console.log("✅ Dados de exemplo criados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar dados de exemplo: ", error);
  }
}
