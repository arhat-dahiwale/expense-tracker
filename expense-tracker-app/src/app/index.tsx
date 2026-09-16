import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';

export default function HomeScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const [catRes, expRes] = await Promise.all([
      fetch(`${API_URL}/categories`),
      fetch(`${API_URL}/expenses`),
    ]);
    setCategories(await catRes.json());
    setExpenses(await expRes.json());
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addExpense = async () => {
    if (!amount || !categoryId) return;
    await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), category_id: categoryId, note }),
    });
    setAmount(''); setNote(''); setCategoryId(null);
    loadData();
  };

  const deleteExpense = async (id: number) => {
    await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Expense Tracker</Text>

      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Note (optional)"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />

      <View style={styles.catRow}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setCategoryId(c.id)}
            style={[styles.catChip, categoryId === c.id && styles.catChipActive]}
          >
            <Text style={categoryId === c.id ? styles.catTextActive : styles.catText}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={addExpense} style={styles.addBtn}>
        <Text style={styles.addBtnText}>Add Expense</Text>
      </TouchableOpacity>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        style={{ marginTop: 16 }}
        renderItem={({ item }) => (
          <View style={styles.expenseRow}>
            <View>
              <Text style={styles.expenseAmount}>₹{item.amount}</Text>
              <Text style={styles.expenseMeta}>{item.category_name} {item.note ? `· ${item.note}` : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteExpense(item.id)}>
              <Text style={{ color: 'red' }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: 'white' },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e2e8f0' },
  catChipActive: { backgroundColor: '#4f46e5' },
  catText: { color: '#334155' },
  catTextActive: { color: 'white' },
  addBtn: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: '600' },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 8 },
  expenseAmount: { fontSize: 16, fontWeight: '600' },
  expenseMeta: { fontSize: 12, color: '#64748b' },
});