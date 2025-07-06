import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    orderBy,
    doc,
    deleteDoc,
    writeBatch
} from 'firebase/firestore';

// --- Configuração do Firebase ---
// NOTA: Cole aqui a configuração do seu projeto Firebase.
// Você pode encontrar isso no console do Firebase em:
// Configurações do projeto > Geral > Seus apps > App da Web > Objeto de configuração do Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAFESdDeRkZtvIQyjFraUhYjHirFNrm3IA",
    authDomain: "financeiroroyalcup.firebaseapp.com",
    projectId: "financeiroroyalcup",
    storageBucket: "financeiroroyalcup.firebasestorage.app",
    messagingSenderId: "680963908575",
    appId: "1:680963908575:web:54cf6c2a06b54f7ab31a6a",
    measurementId: "G-NZBFXGKRDB"
  };

// --- Inicialização dos Serviços ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Componentes da UI ---

const AuthPage = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-yellow-400">Royal Cup Finance</h1>
                    <p className="text-gray-400">{isLogin ? 'Acesse sua conta' : 'Crie uma nova conta'}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        className="w-full py-2 font-semibold text-gray-900 bg-yellow-400 rounded-md hover:bg-yellow-500 transition-colors"
                    >
                        {isLogin ? 'Entrar' : 'Cadastrar'}
                    </button>
                    <p className="text-sm text-center text-gray-400">
                        {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-1 font-semibold text-yellow-400 hover:underline"
                        >
                            {isLogin ? 'Cadastre-se' : 'Faça login'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

const TransactionForm = () => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!amount || !description || !auth.currentUser) return;
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'transactions'), {
                value: parseFloat(amount),
                description: description,
                type: type,
                createdBy: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                createdAt: new Date(),
            });
            setAmount('');
            setDescription('');
        } catch (error) {
            console.error("Error adding transaction: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-white">Nova Transação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição (ex: Compra de bolas)"
                    className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                />
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Valor (R$)"
                    className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                />
                <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="expense"
                            checked={type === 'expense'}
                            onChange={(e) => setType(e.target.value)}
                            className="form-radio h-4 w-4 text-red-500 bg-gray-700 border-gray-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-red-400">Saída</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="income"
                            checked={type === 'income'}
                            onChange={(e) => setType(e.target.value)}
                            className="form-radio h-4 w-4 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-green-400">Entrada</span>
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 font-semibold text-gray-900 bg-yellow-400 rounded-md hover:bg-yellow-500 transition-colors disabled:bg-gray-500"
                >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar Transação'}
                </button>
            </form>
        </div>
    );
};

const TransactionList = ({ transactions, setTransactions }) => {
    
    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja apagar esta transação?")) {
            try {
                await deleteDoc(doc(db, "transactions", id));
            } catch (error) {
                console.error("Error deleting transaction: ", error);
            }
        }
    };
    
    const handleDeleteAll = async () => {
        if (window.confirm("ATENÇÃO: ISSO APAGARÁ TODAS AS TRANSAÇÕES. Deseja continuar?")) {
            try {
                const batch = writeBatch(db);
                transactions.forEach(transaction => {
                    const docRef = doc(db, "transactions", transaction.id);
                    batch.delete(docRef);
                });
                await batch.commit();
                setTransactions([]);
            } catch (error) {
                console.error("Error deleting all transactions: ", error);
            }
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-md mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Últimas Movimentações</h2>
                <button onClick={handleDeleteAll} className="px-3 py-1 text-sm bg-red-800 text-white rounded-md hover:bg-red-700 transition">
                    Apagar Tudo
                </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length > 0 ? (
                    transactions.map((t) => (
                        <div key={t.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
                            <div>
                                <p className="font-semibold text-white">{t.description}</p>
                                <p className="text-xs text-gray-400">
                                    {new Date(t.createdAt?.toDate()).toLocaleString('pt-BR')} por {t.userEmail}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.type === 'income' ? '+' : '-'} R$ {t.value.toFixed(2)}
                                </span>
                                <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center py-4">Nenhuma transação registrada ainda.</p>
                )}
            </div>
        </div>
    );
};

const Dashboard = ({ user }) => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transactionsData = [];
            querySnapshot.forEach((doc) => {
                transactionsData.push({ ...doc.data(), id: doc.id });
            });
            setTransactions(transactionsData);
        });

        return () => unsubscribe();
    }, []);

    const balance = useMemo(() => {
        return transactions.reduce((acc, t) => {
            return t.type === 'income' ? acc + t.value : acc - t.value;
        }, 0);
    }, [transactions]);

    return (
        <div className="bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-yellow-400">Royal Cup Finance</h1>
                <div className="flex items-center space-x-4">
                    <span className="text-white hidden sm:block">{user.email}</span>
                    <button
                        onClick={() => signOut(auth)}
                        className="px-4 py-2 font-semibold text-gray-900 bg-yellow-400 rounded-md hover:bg-yellow-500 transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="p-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-xl text-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800">Saldo Atual</h2>
                    <p className={`text-5xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-900'}`}>
                        R$ {balance.toFixed(2)}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TransactionForm />
                    <TransactionList transactions={transactions} setTransactions={setTransactions} />
                </div>
            </main>
        </div>
    );
};


export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">Carregando...</div>;
    }

    return user ? <Dashboard user={user} /> : <AuthPage setUser={setUser} />;
}
