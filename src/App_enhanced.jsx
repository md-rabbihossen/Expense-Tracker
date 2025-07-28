import {
  ArrowLeft,
  BarChart3,
  Bike,
  Book,
  Car,
  Coffee,
  DollarSign,
  Download,
  FileText,
  Gift,
  GraduationCap,
  Home,
  Home as HomeIcon,
  Music,
  Smartphone as PhoneIcon,
  Plane,
  Plus,
  Search,
  Settings,
  Shirt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  Target,
  TrendingDown,
  TrendingUp,
  Tv,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Enhanced Icon Map for better categorization
const iconMap = {
  Bike,
  Smartphone,
  Wallet,
  Car,
  HomeIcon,
  ShoppingBag,
  Coffee,
  Book,
  Shirt,
  Zap,
  Stethoscope,
  Plane,
  GraduationCap,
  Gift,
  Music,
  Tv,
  PhoneIcon,
};

// Currency formatter utility
const formatCurrency = (amount, currency = "USD", locale = "en-US") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Date formatter utility
const formatDate = (date, format = "short") => {
  const d = new Date(date);
  const options = {
    short: { month: "short", day: "numeric" },
    long: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    numeric: { year: "numeric", month: "2-digit", day: "2-digit" },
  };
  return d.toLocaleDateString("en-US", options[format]);
};

// Input validation utilities
const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000;
};

const validateText = (text, minLength = 1, maxLength = 50) => {
  return (
    text && text.trim().length >= minLength && text.trim().length <= maxLength
  );
};

// Enhanced expense categories with icons
const expenseCategories = [
  {
    name: "Food & Dining",
    icon: "🍔",
    subcategories: ["Restaurant", "Groceries", "Coffee", "Fast Food"],
  },
  {
    name: "Transportation",
    icon: "🚗",
    subcategories: ["Gas", "Public Transit", "Uber/Taxi", "Parking"],
  },
  {
    name: "Shopping",
    icon: "🛍️",
    subcategories: [
      "Clothing",
      "Electronics",
      "Home & Garden",
      "Personal Care",
    ],
  },
  {
    name: "Entertainment",
    icon: "🎬",
    subcategories: ["Movies", "Games", "Sports", "Hobbies"],
  },
  {
    name: "Bills & Utilities",
    icon: "💡",
    subcategories: ["Electricity", "Water", "Internet", "Phone"],
  },
  {
    name: "Healthcare",
    icon: "🏥",
    subcategories: ["Doctor", "Pharmacy", "Insurance", "Dental"],
  },
  {
    name: "Education",
    icon: "📚",
    subcategories: ["Books", "Courses", "Tuition", "Supplies"],
  },
  {
    name: "Travel",
    icon: "✈️",
    subcategories: ["Flights", "Hotels", "Car Rental", "Activities"],
  },
  {
    name: "Gifts & Donations",
    icon: "🎁",
    subcategories: ["Gifts", "Charity", "Religious", "Tips"],
  },
  {
    name: "Personal",
    icon: "👤",
    subcategories: ["Clothing", "Beauty", "Fitness", "Subscriptions"],
  },
];

const incomeCategories = [
  { name: "Salary", icon: "💰", description: "Primary employment income" },
  { name: "Freelance", icon: "💻", description: "Contract and freelance work" },
  { name: "Business", icon: "🏢", description: "Business revenue" },
  { name: "Investment", icon: "📈", description: "Dividends, interest, gains" },
  { name: "Gift", icon: "🎁", description: "Money received as gifts" },
  { name: "Refund", icon: "💸", description: "Returns and refunds" },
  { name: "Other", icon: "💵", description: "Other income sources" },
];

// Main App Component
export default function App() {
  const initialState = {
    profileImage: "https://avatar.iran.liara.run/public/boy",
    userName: "Md. Rahat Hossen",
    userEmail: "mohammadrahathossen@gmail.com",
    currency: "USD",
    locale: "en-US",
    totalSalary: 0,
    totalExpense: 0,
    monthlyLimit: 8000.0,
    entries: [],
    categories: [...expenseCategories, ...incomeCategories],
    budgets: {
      monthly: 8000,
      categories: {},
    },
    savings: {
      current: 0,
      monthlyGoal: 1000,
      monthlyContributions: 0,
      goals: [],
      emergencyFund: {
        target: 10000,
        current: 0,
      },
    },
    reminders: [],
    notifications: [],
    unreadNotifications: false,
    settings: {
      theme: "light",
      notifications: true,
      biometricLock: false,
      autoBackup: true,
      currency: "USD",
      language: "en",
    },
    analytics: {
      monthlySpending: {},
      categoryTrends: {},
      savingsRate: 0,
    },
    lastReset: new Date().toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
    }),
    lastBackup: null,
    version: "2.0.0",
  };

  const [data, setData] = useState(() => {
    try {
      const savedData = localStorage.getItem("financeData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // Migrate old data to new structure
        const migratedData = { ...initialState, ...parsedData };

        // Ensure all required fields exist
        if (!migratedData.settings)
          migratedData.settings = initialState.settings;
        if (!migratedData.analytics)
          migratedData.analytics = initialState.analytics;
        if (!migratedData.budgets) migratedData.budgets = initialState.budgets;
        if (!migratedData.categories)
          migratedData.categories = initialState.categories;

        // Monthly reset logic
        const now = new Date();
        const currentMonthYear = now.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "2-digit",
        });

        if (migratedData.lastReset !== currentMonthYear) {
          migratedData.lastReset = currentMonthYear;
          migratedData.savings.monthlyContributions = 0;
          if (migratedData.savings.goals) {
            migratedData.savings.goals.forEach(
              (g) => (g.monthlyContributions = 0)
            );
          }
        }

        return migratedData;
      }
      return initialState;
    } catch (error) {
      console.error("Error loading saved data:", error);
      return initialState;
    }
  });

  const [currentPage, setCurrentPage] = useState("overview");
  const [activeAction, setActiveAction] = useState("savings");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Enhanced analytics calculations
  const analytics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyEntries = data.entries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      );
    });

    const monthlyIncome = monthlyEntries
      .filter((e) => e.transactionType === "income")
      .reduce((acc, entry) => acc + entry.amount, 0);

    const monthlyExpense = monthlyEntries
      .filter((e) => e.transactionType === "expense")
      .reduce((acc, entry) => acc + entry.amount, 0);

    const savingsRate =
      monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100
        : 0;

    // Category breakdown
    const categorySpending = {};
    monthlyEntries
      .filter((e) => e.transactionType === "expense")
      .forEach((entry) => {
        categorySpending[entry.category] =
          (categorySpending[entry.category] || 0) + entry.amount;
      });

    // Spending trends (last 6 months)
    const spendingTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthEntries = data.entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() === date.getMonth() &&
          entryDate.getFullYear() === date.getFullYear()
        );
      });

      const monthSpending = monthEntries
        .filter((e) => e.transactionType === "expense")
        .reduce((acc, entry) => acc + entry.amount, 0);

      spendingTrends.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        amount: monthSpending,
      });
    }

    return {
      monthlyIncome,
      monthlyExpense,
      savingsRate,
      categorySpending,
      spendingTrends,
      totalBalance: data.totalSalary - data.totalExpense,
    };
  }, [data.entries, data.totalSalary, data.totalExpense]);

  // Auto-save with error handling
  useEffect(() => {
    try {
      localStorage.setItem("financeData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data:", error);
      // Show user notification about save failure
      addNotification(
        "Failed to save data. Please check your storage space.",
        "error"
      );
    }
  }, [data]);

  // Enhanced reminder system
  useEffect(() => {
    const checkReminders = () => {
      if (!data.settings.notifications) return;

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      data.reminders.forEach((reminder) => {
        if (!reminder.enabled || reminder.triggered) return;

        const reminderDate = new Date(reminder.date);
        let shouldTrigger = false;

        if (reminder.time === currentTime) {
          switch (reminder.frequency) {
            case "Daily":
              shouldTrigger = true;
              break;
            case "Weekly":
              if (now.getDay() === reminderDate.getDay()) shouldTrigger = true;
              break;
            case "Monthly":
              if (now.getDate() === reminderDate.getDate())
                shouldTrigger = true;
              break;
            case "Yearly":
              if (
                now.getDate() === reminderDate.getDate() &&
                now.getMonth() === reminderDate.getMonth()
              )
                shouldTrigger = true;
              break;
            default:
              if (now.toDateString() === reminderDate.toDateString())
                shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          triggerReminder(reminder);
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [data.reminders, data.settings.notifications]);

  // Auto-backup system
  useEffect(() => {
    if (data.settings.autoBackup) {
      const lastBackup = data.lastBackup ? new Date(data.lastBackup) : null;
      const now = new Date();
      const daysSinceBackup = lastBackup
        ? Math.floor((now - lastBackup) / (1000 * 60 * 60 * 24))
        : Infinity;

      if (daysSinceBackup >= 7) {
        // Auto-backup weekly
        handleAutoBackup();
      }
    }
  }, [data.settings.autoBackup]);

  // Enhanced functions
  const addTransaction = useCallback((newTransaction) => {
    if (
      !validateAmount(newTransaction.amount) ||
      !validateText(newTransaction.type)
    ) {
      addNotification("Invalid transaction data", "error");
      return false;
    }

    const transaction = {
      ...newTransaction,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      amount: parseFloat(newTransaction.amount),
    };

    setData((prevData) => {
      const newData = { ...prevData };
      newData.entries = [transaction, ...newData.entries];

      if (transaction.transactionType === "income") {
        newData.totalSalary += transaction.amount;
      } else {
        newData.totalExpense += transaction.amount;
      }

      return newData;
    });

    addNotification(
      `${
        transaction.transactionType === "income" ? "Income" : "Expense"
      } added successfully!`,
      "success"
    );
    return true;
  }, []);

  const addNotification = useCallback((text, type = "info") => {
    const notification = {
      id: Date.now() + Math.random(),
      text,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setData((prevData) => ({
      ...prevData,
      notifications: [notification, ...prevData.notifications.slice(0, 49)], // Keep only 50 notifications
      unreadNotifications: true,
    }));
  }, []);

  const triggerReminder = useCallback(
    (reminder) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Expense Tracker Reminder", {
          body: reminder.title,
          icon: "/assets/logo.png",
        });
      }

      setData((prevData) => ({
        ...prevData,
        reminders: prevData.reminders.map((r) =>
          r.id === reminder.id ? { ...r, triggered: true } : r
        ),
      }));

      addNotification(`Reminder: ${reminder.title}`, "reminder");
    },
    [addNotification]
  );

  const handleAutoBackup = useCallback(() => {
    try {
      const backupData = {
        ...data,
        backupDate: new Date().toISOString(),
        version: data.version,
      };

      localStorage.setItem("financeDataBackup", JSON.stringify(backupData));
      setData((prevData) => ({
        ...prevData,
        lastBackup: new Date().toISOString(),
      }));

      addNotification("Data backed up successfully!", "success");
    } catch (error) {
      console.error("Auto-backup failed:", error);
      addNotification("Auto-backup failed", "error");
    }
  }, [data, addNotification]);

  const exportData = useCallback(
    (format = "json") => {
      try {
        const exportData = {
          ...data,
          exportDate: new Date().toISOString(),
          version: data.version,
        };

        if (format === "json") {
          const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `expense-tracker-${
            new Date().toISOString().split("T")[0]
          }.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else if (format === "csv") {
          exportToCSV();
        }

        addNotification(`Data exported as ${format.toUpperCase()}!`, "success");
      } catch (error) {
        console.error("Export failed:", error);
        addNotification("Export failed", "error");
      }
    },
    [data, addNotification]
  );

  const exportToCSV = useCallback(() => {
    const headers = [
      "Date",
      "Type",
      "Category",
      "Amount",
      "Description",
      "Payment Method",
    ];
    const csvData = [
      headers.join(","),
      ...data.entries.map((entry) =>
        [
          entry.date,
          entry.transactionType,
          entry.category,
          entry.amount,
          entry.type,
          entry.paymentMethod || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expense-tracker-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data.entries]);

  const importData = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);

          // Validate imported data structure
          if (!importedData.entries || !Array.isArray(importedData.entries)) {
            throw new Error("Invalid data format");
          }

          setData((prevData) => ({
            ...prevData,
            ...importedData,
            lastReset: prevData.lastReset, // Keep current reset date
            settings: { ...prevData.settings, ...importedData.settings },
          }));

          addNotification("Data imported successfully!", "success");
        } catch (error) {
          console.error("Import failed:", error);
          addNotification("Import failed: Invalid file format", "error");
        }
      };
      reader.readAsText(file);
    },
    [addNotification]
  );

  // Enhanced filtering and search
  const filteredEntries = useMemo(() => {
    let filtered = [...data.entries];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((entry) => entry.category === filterCategory);
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= dateRange.start && entryDate <= dateRange.end;
      });
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.entries, searchQuery, filterCategory, dateRange]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return (
          <OverviewPage
            data={data}
            analytics={analytics}
            setCurrentPage={setCurrentPage}
            activeAction={activeAction}
            setActiveAction={setActiveAction}
          />
        );
      case "analytics":
        return (
          <AnalyticsPage
            data={data}
            analytics={analytics}
            setCurrentPage={setCurrentPage}
          />
        );
      case "add":
        return (
          <AddPage
            setCurrentPage={setCurrentPage}
            entries={filteredEntries.slice(0, 5)}
          />
        );
      case "add-income":
        return (
          <AddTransactionPage
            type="income"
            setCurrentPage={setCurrentPage}
            addTransaction={addTransaction}
            categories={incomeCategories}
          />
        );
      case "add-expense":
        return (
          <AddTransactionPage
            type="expense"
            setCurrentPage={setCurrentPage}
            addTransaction={addTransaction}
            categories={expenseCategories}
          />
        );
      case "entries":
        return (
          <EntriesPage
            entries={filteredEntries}
            setCurrentPage={setCurrentPage}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categories={data.categories}
          />
        );
      case "settings":
        return (
          <SettingsPage
            data={data}
            setData={setData}
            setCurrentPage={setCurrentPage}
            onExport={exportData}
            onImport={importData}
          />
        );
      default:
        return (
          <OverviewPage
            data={data}
            analytics={analytics}
            setCurrentPage={setCurrentPage}
            activeAction={activeAction}
            setActiveAction={setActiveAction}
          />
        );
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md md:max-w-4xl bg-white font-sans shadow-2xl rounded-3xl flex flex-col h-screen md:h-[95vh] relative overflow-hidden">
        {isLoading && <LoadingSpinner />}

        <div className="flex-grow overflow-hidden flex flex-col pb-20">
          {renderPage()}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => importData(e.target.files[0])}
          className="hidden"
          accept="application/json"
        />

        <input
          type="file"
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
        />

        <div className="absolute bottom-0 left-0 right-0">
          <BottomNav
            activeTab={currentPage}
            setCurrentPage={setCurrentPage}
            unreadNotifications={data.unreadNotifications}
            setData={setData}
          />
        </div>
      </div>
    </div>
  );
}

// Enhanced Page Components

const OverviewPage = ({
  data,
  analytics,
  setCurrentPage,
  activeAction,
  setActiveAction,
}) => (
  <>
    <Header
      setCurrentPage={setCurrentPage}
      profileImage={data.profileImage}
      userName={data.userName}
    />
    <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
      <SummaryCards analytics={analytics} setCurrentPage={setCurrentPage} />
      <QuickInsights analytics={analytics} />
      <ActionButtons
        activeAction={activeAction}
        setActiveAction={setActiveAction}
        setCurrentPage={setCurrentPage}
      />
      <LatestEntries
        entries={data.entries.slice(0, 5)}
        setCurrentPage={setCurrentPage}
      />
    </main>
  </>
);

const AnalyticsPage = ({ data, analytics, setCurrentPage }) => (
  <>
    <PageHeader title="Analytics" onBack={() => setCurrentPage("overview")} />
    <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendingChart data={analytics.spendingTrends} />
        <CategoryBreakdown data={analytics.categorySpending} />
        <SavingsProgress data={data.savings} />
        <MonthlyComparison analytics={analytics} />
      </div>
    </main>
  </>
);

const AddTransactionPage = ({
  type,
  setCurrentPage,
  addTransaction,
  categories,
}) => {
  const [formData, setFormData] = useState({
    type: categories[0]?.name || "",
    amount: "",
    category: "Personal",
    subcategory: "",
    description: "",
    paymentMethod: "Cash",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!validateAmount(formData.amount)) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!validateText(formData.type)) {
      newErrors.type = "Please enter a description";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const transaction = {
      ...formData,
      transactionType: type,
      amount: parseFloat(formData.amount),
      date: formData.date,
    };

    if (addTransaction(transaction)) {
      setCurrentPage("overview");
    }
  };

  return (
    <>
      <PageHeader
        title={`Add ${type === "income" ? "Income" : "Expense"}`}
        onBack={() => setCurrentPage("add")}
      />
      <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
                maxLength="100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "Cash",
                  "Card",
                  "Bank Transfer",
                  "Digital Wallet",
                  "Check",
                  "Other",
                ].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, paymentMethod: method })
                    }
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.paymentMethod === method
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Add {type === "income" ? "Income" : "Expense"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
};

const EntriesPage = ({
  entries,
  setCurrentPage,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredByTab = entries.filter((entry) => {
    if (activeTab === "all") return true;
    if (activeTab === "income") return entry.transactionType === "income";
    if (activeTab === "expense") return entry.transactionType === "expense";
    return true;
  });

  return (
    <>
      <PageHeader
        title="Transactions"
        onBack={() => setCurrentPage("overview")}
      />
      <main className="flex-grow p-4 sm:p-6 flex flex-col">
        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                filterCategory === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              All
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.name}
                onClick={() => setFilterCategory(cat.name)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  filterCategory === cat.name
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white p-1 rounded-2xl flex justify-around shadow-sm mb-4">
          {["all", "income", "expense"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${
                activeTab === tab
                  ? "bg-blue-500 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Entries List */}
        <div className="flex-grow space-y-3 overflow-y-auto">
          {filteredByTab.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No transactions found.</p>
            </div>
          ) : (
            filteredByTab.map((entry) => (
              <EnhancedEntryItem key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </main>
    </>
  );
};

const SettingsPage = ({
  data,
  setData,
  setCurrentPage,
  onExport,
  onImport,
}) => {
  const [activeSection, setActiveSection] = useState("general");

  const updateSetting = (key, value) => {
    setData((prevData) => ({
      ...prevData,
      settings: {
        ...prevData.settings,
        [key]: value,
      },
    }));
  };

  return (
    <>
      <PageHeader title="Settings" onBack={() => setCurrentPage("overview")} />
      <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={data.userName}
                  onChange={(e) =>
                    setData({ ...data, userName: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={data.userEmail}
                  onChange={(e) =>
                    setData({ ...data, userEmail: e.target.value })
                  }
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* App Settings */}
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">App Settings</h3>
            <div className="space-y-4">
              <SettingToggle
                label="Notifications"
                description="Receive reminder notifications"
                checked={data.settings.notifications}
                onChange={(checked) => updateSetting("notifications", checked)}
              />
              <SettingToggle
                label="Auto Backup"
                description="Automatically backup your data weekly"
                checked={data.settings.autoBackup}
                onChange={(checked) => updateSetting("autoBackup", checked)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={data.settings.currency}
                  onChange={(e) => updateSetting("currency", e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BDT">BDT (৳)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">Data Management</h3>
            <div className="space-y-3">
              <button
                onClick={() => onExport("json")}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download size={20} />
                Export Data (JSON)
              </button>
              <button
                onClick={() => onExport("csv")}
                className="w-full flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FileText size={20} />
                Export Data (CSV)
              </button>
              <button
                onClick={() =>
                  document.querySelector('input[type="file"]').click()
                }
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Upload size={20} />
                Import Data
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">App Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Version: {data.version}</p>
              <p>
                Last Backup:{" "}
                {data.lastBackup
                  ? formatDate(data.lastBackup, "long")
                  : "Never"}
              </p>
              <p>Total Entries: {data.entries.length}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

// Enhanced Components

const Header = ({ setCurrentPage, profileImage, userName }) => (
  <header className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-3xl">
    <div>
      <h1 className="text-2xl font-bold">
        Hello, {userName?.split(" ")[0] || "User"}
      </h1>
      <p className="text-blue-100 text-sm">Welcome back to your dashboard</p>
    </div>
    <div className="relative">
      <button
        onClick={() => setCurrentPage("settings")}
        className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 overflow-hidden"
      >
        <img
          src={profileImage}
          alt="Profile"
          className="w-full h-full rounded-full object-cover"
        />
      </button>
    </div>
  </header>
);

const PageHeader = ({ title, onBack, actions = null }) => (
  <header className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
    <div className="flex items-center">
      <button
        onClick={onBack}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-3"
      >
        <ArrowLeft size={24} className="text-gray-700" />
      </button>
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </header>
);

const SummaryCards = ({ analytics, setCurrentPage }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-3xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/20 rounded-full">
          <Wallet size={24} />
        </div>
        <TrendingUp size={20} className="text-blue-200" />
      </div>
      <p className="text-blue-100 text-sm">Total Balance</p>
      <p className="text-2xl font-bold">
        {formatCurrency(analytics.totalBalance)}
      </p>
    </div>

    <div className="bg-white p-6 rounded-3xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-green-100 rounded-full">
          <TrendingUp size={24} className="text-green-600" />
        </div>
        <div className="text-xs text-gray-500">This Month</div>
      </div>
      <p className="text-gray-600 text-sm">Income</p>
      <p className="text-xl font-bold text-gray-800">
        {formatCurrency(analytics.monthlyIncome)}
      </p>
    </div>

    <button
      onClick={() => setCurrentPage("analytics")}
      className="bg-white p-6 rounded-3xl shadow-lg text-left hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-red-100 rounded-full">
          <TrendingDown size={24} className="text-red-600" />
        </div>
        <BarChart3 size={16} className="text-gray-400" />
      </div>
      <p className="text-gray-600 text-sm">Monthly Expense</p>
      <p className="text-xl font-bold text-gray-800">
        {formatCurrency(analytics.monthlyExpense)}
      </p>
    </button>
  </div>
);

const QuickInsights = ({ analytics }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg">
    <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Insights</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div
          className={`text-2xl font-bold ${
            analytics.savingsRate >= 20
              ? "text-green-600"
              : analytics.savingsRate >= 10
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {analytics.savingsRate.toFixed(1)}%
        </div>
        <p className="text-sm text-gray-600">Savings Rate</p>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">
          {Object.keys(analytics.categorySpending).length}
        </div>
        <p className="text-sm text-gray-600">Active Categories</p>
      </div>
    </div>
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600">
        {analytics.savingsRate >= 20
          ? "Great job! You're saving well this month."
          : analytics.savingsRate >= 10
          ? "Good savings rate. Consider increasing it gradually."
          : "Try to save more this month for better financial health."}
      </p>
    </div>
  </div>
);

const SpendingChart = ({ data }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg">
    <h3 className="text-lg font-bold text-gray-800 mb-4">Spending Trends</h3>
    <div className="h-48 flex items-end justify-between space-x-2">
      {data.map((item, index) => {
        const maxAmount = Math.max(...data.map((d) => d.amount));
        const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;

        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
              style={{ height: `${height}%`, minHeight: "4px" }}
            />
            <p className="text-xs text-gray-600 mt-2">{item.month}</p>
          </div>
        );
      })}
    </div>
  </div>
);

const CategoryBreakdown = ({ data }) => {
  const categories = Object.entries(data).slice(0, 5);
  const total = Object.values(data).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Top Categories</h3>
      <div className="space-y-3">
        {categories.map(([category, amount], index) => {
          const percentage = total > 0 ? (amount / total) * 100 : 0;
          const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-yellow-500",
            "bg-red-500",
            "bg-purple-500",
          ];

          return (
            <div key={category}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {category}
                </span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    colors[index % colors.length]
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SavingsProgress = ({ data }) => {
  const percentage = Math.min(100, (data.current / data.monthlyGoal) * 100);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Savings Goal</h3>
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 36 36"
          >
            <circle
              className="text-gray-200"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="15.9155"
              cx="18"
              cy="18"
            />
            <circle
              className="text-blue-500"
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="15.9155"
              cx="18"
              cy="18"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-blue-600">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {formatCurrency(data.current)} of {formatCurrency(data.monthlyGoal)}
        </p>
      </div>
    </div>
  );
};

const MonthlyComparison = ({ analytics }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg">
    <h3 className="text-lg font-bold text-gray-800 mb-4">
      This Month vs Last Month
    </h3>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Income</span>
        <div className="flex items-center">
          <span className="font-semibold">
            {formatCurrency(analytics.monthlyIncome)}
          </span>
          <TrendingUp size={16} className="text-green-500 ml-2" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Expenses</span>
        <div className="flex items-center">
          <span className="font-semibold">
            {formatCurrency(analytics.monthlyExpense)}
          </span>
          <TrendingDown size={16} className="text-red-500 ml-2" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 border-t">
        <span className="font-semibold text-gray-800">Net</span>
        <span
          className={`font-bold ${
            analytics.monthlyIncome - analytics.monthlyExpense >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {formatCurrency(analytics.monthlyIncome - analytics.monthlyExpense)}
        </span>
      </div>
    </div>
  </div>
);

const EnhancedEntryItem = ({ entry }) => {
  const isExpense = entry.transactionType === "expense";
  const colorClass = isExpense ? "text-red-500" : "text-green-500";

  const getIconForType = (type) => {
    const iconMap = {
      "Food & Dining": "🍔",
      Transportation: "🚗",
      Shopping: "🛍️",
      Entertainment: "🎬",
      "Bills & Utilities": "💡",
      Healthcare: "🏥",
      Education: "📚",
      Travel: "✈️",
      "Gifts & Donations": "🎁",
      Personal: "👤",
      Salary: "💰",
      Freelance: "💻",
      Business: "🏢",
      Investment: "📈",
      Gift: "🎁",
      Refund: "💸",
      Other: "💵",
    };
    return iconMap[type] || "💵";
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 text-xl">
            {getIconForType(entry.type)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{entry.type}</p>
            <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
            {entry.description && (
              <p className="text-xs text-gray-400 mt-1">{entry.description}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold ${colorClass}`}>
            {isExpense ? "-" : "+"} {formatCurrency(entry.amount)}
          </p>
          <p className="text-sm text-gray-500">{entry.paymentMethod}</p>
        </div>
      </div>
    </div>
  );
};

const ActionButtons = ({ activeAction, setActiveAction, setCurrentPage }) => {
  const actions = [
    { id: "savings", label: "Savings", icon: Target, color: "blue" },
    { id: "analytics", label: "Analytics", icon: BarChart3, color: "green" },
    { id: "budget", label: "Budget", icon: Wallet, color: "purple" },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg">
      <div className="grid grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.id;

          return (
            <button
              key={action.id}
              onClick={() => {
                setActiveAction(action.id);
                setCurrentPage(action.id);
              }}
              className={`p-4 rounded-2xl text-center transition-all transform hover:scale-105 ${
                isActive
                  ? `bg-${action.color}-500 text-white shadow-lg`
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon size={24} className="mx-auto mb-2" />
              <p className="text-sm font-semibold">{action.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const LatestEntries = ({ entries, setCurrentPage }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
      <button
        onClick={() => setCurrentPage("entries")}
        className="text-blue-500 text-sm font-semibold hover:text-blue-600"
      >
        View All
      </button>
    </div>
    <div className="space-y-3">
      {entries.slice(0, 5).map((entry) => (
        <EnhancedEntryItem key={entry.id} entry={entry} />
      ))}
      {entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No transactions yet.</p>
          <p className="text-sm">Start by adding your first transaction!</p>
        </div>
      )}
    </div>
  </div>
);

const AddPage = ({ setCurrentPage, entries }) => (
  <>
    <PageHeader
      title="Add Transaction"
      onBack={() => setCurrentPage("overview")}
    />
    <main className="flex-grow p-6 space-y-6 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setCurrentPage("add-income")}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <TrendingUp size={32} className="mx-auto mb-3" />
          <span className="block font-bold text-lg">Add Income</span>
          <span className="block text-green-100 text-sm">
            Record money received
          </span>
        </button>

        <button
          onClick={() => setCurrentPage("add-expense")}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white p-8 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
        >
          <TrendingDown size={32} className="mx-auto mb-3" />
          <span className="block font-bold text-lg">Add Expense</span>
          <span className="block text-red-100 text-sm">Record money spent</span>
        </button>
      </div>

      <LatestEntries entries={entries} setCurrentPage={setCurrentPage} />
    </main>
  </>
);

const SettingToggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium text-gray-800">{label}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

const LoadingSpinner = () => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const BottomNav = ({
  activeTab,
  setCurrentPage,
  unreadNotifications,
  setData,
}) => {
  const navItems = [
    { id: "overview", icon: Home, label: "Home" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "entries", icon: FileText, label: "Entries" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const handleNotificationClick = () => {
    setCurrentPage("notifications");
    setData((prev) => ({ ...prev, unreadNotifications: false }));
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-t-3xl">
      <div className="flex justify-around items-center p-4 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || activeTab.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center p-2 transition-all ${
                isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Add Button */}
        <button
          onClick={() => setCurrentPage("add")}
          className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-2xl border-4 border-white hover:shadow-3xl transform hover:scale-110 transition-all"
        >
          <Plus size={28} />
        </button>
      </div>
    </nav>
  );
};
