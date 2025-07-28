import {
  ArrowLeft,
  BarChart3,
  Bike,
  Calendar as CalendarIcon,
  ChevronRight,
  DollarSign,
  Download,
  FileText,
  Home,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Smartphone,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Icon Map for serializing and deserializing icons from localStorage
const iconMap = {
  Bike,
  Smartphone,
  Wallet,
};

// Enhanced utility functions
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date, format = "short") => {
  const d = new Date(date);
  if (format === "short") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000;
};

const validateText = (text, minLength = 1, maxLength = 50) => {
  return (
    text && text.trim().length >= minLength && text.trim().length <= maxLength
  );
};

// Enhanced categories
const expenseCategories = [
  { name: "Food & Dining", icon: "🍔" },
  { name: "Transportation", icon: "🚗" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Bills & Utilities", icon: "💡" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Education", icon: "📚" },
  { name: "Travel", icon: "✈️" },
  { name: "Personal", icon: "👤" },
];

const incomeCategories = [
  { name: "Salary", icon: "💰" },
  { name: "Freelance", icon: "💻" },
  { name: "Business", icon: "🏢" },
  { name: "Investment", icon: "📈" },
  { name: "Gift", icon: "🎁" },
  { name: "Other", icon: "💵" },
];

export default function App() {
  const initialState = {
    profileImage: "https://avatar.iran.liara.run/public/boy",
    userName: "Md. Rahat Hossen",
    userEmail: "mohammadrahathossen@gmail.com",
    currency: "USD",
    totalSalary: 0,
    totalExpense: 0,
    monthlyLimit: 8000.0,
    entries: [],
    savings: {
      current: 0,
      monthlyGoal: 1000,
      monthlyContributions: 0,
      goals: [],
    },
    reminders: [],
    notifications: [],
    unreadNotifications: false,
    settings: {
      theme: "light",
      notifications: true,
      autoBackup: true,
      currency: "USD",
    },
    lastReset: new Date().toLocaleDateString("en-CA", {
      year: "numeric",
      month: "2-digit",
    }),
    version: "2.0.0",
  };

  const [data, setData] = useState(() => {
    try {
      const savedData = localStorage.getItem("financeData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // Migrate old data and ensure all fields exist
        const migratedData = { ...initialState, ...parsedData };
        if (!migratedData.settings)
          migratedData.settings = initialState.settings;
        if (!migratedData.currency)
          migratedData.currency = initialState.currency;

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
        const category = entry.type || entry.category || "Other";
        categorySpending[category] =
          (categorySpending[category] || 0) + entry.amount;
      });

    return {
      monthlyIncome,
      monthlyExpense,
      savingsRate,
      categorySpending,
      totalBalance: data.totalSalary - data.totalExpense,
    };
  }, [data.entries, data.totalSalary, data.totalExpense]);

  // Enhanced notification system
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
      notifications: [notification, ...prevData.notifications.slice(0, 49)],
      unreadNotifications: true,
    }));
  }, []);

  // Auto-save with error handling
  useEffect(() => {
    try {
      localStorage.setItem("financeData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving data:", error);
      addNotification(
        "Failed to save data. Please check your storage space.",
        "error"
      );
    }
  }, [data, addNotification]);

  // Enhanced transaction handler
  const addTransaction = useCallback(
    (newTransaction) => {
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
        } of ${formatCurrency(transaction.amount)} added successfully!`,
        "success"
      );
      return true;
    },
    [addNotification]
  );

  // Export functionality
  const exportData = useCallback(
    (format = "json") => {
      try {
        if (format === "json") {
          const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: data.version,
          };

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
                entry.type,
                entry.amount,
                entry.description || "",
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
        }

        addNotification(`Data exported as ${format.toUpperCase()}!`, "success");
      } catch (error) {
        console.error("Export failed:", error);
        addNotification("Export failed", "error");
      }
    },
    [data, addNotification]
  );

  // Enhanced filtering
  const filteredEntries = useMemo(() => {
    let filtered = [...data.entries];

    if (searchQuery) {
      filtered = filtered.filter(
        (entry) =>
          entry.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (entry.description &&
            entry.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((entry) => entry.type === filterCategory);
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.entries, searchQuery, filterCategory]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      data.reminders.forEach((reminder) => {
        const reminderDate = new Date(reminder.date);
        let shouldTrigger = false;
        if (reminder.enabled && reminder.time === currentTime) {
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

        if (shouldTrigger && !reminder.triggered) {
          showNotification(reminder);
          setData((prevData) => ({
            ...prevData,
            reminders: prevData.reminders.map((r) =>
              r.id === reminder.id ? { ...r, triggered: true } : r
            ),
            notifications: [
              {
                id: Date.now(),
                text: `Reminder: ${reminder.title}`,
                timestamp: new Date(),
                read: false,
              },
              ...prevData.notifications,
            ],
            unreadNotifications: true,
          }));
        }
      });
    };

    const showNotification = (reminder) => {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
      } else if (Notification.permission === "granted") {
        new Notification("Finance App Reminder", { body: reminder.title });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Finance App Reminder", { body: reminder.title });
          }
        });
      }
    };

    const interval = setInterval(checkReminders, 1000 * 30); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [data.reminders]);

  useEffect(() => {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>`;
    document.head.appendChild(favicon);

    const appleTouchIcon = document.createElement("link");
    appleTouchIcon.rel = "apple-touch-icon";
    appleTouchIcon.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💰</text></svg>`;
    document.head.appendChild(appleTouchIcon);

    return () => {
      document.head.removeChild(favicon);
      document.head.removeChild(appleTouchIcon);
    };
  }, []);

  const addReminder = (newReminder) => {
    setData((prevData) => ({
      ...prevData,
      reminders: [...prevData.reminders, newReminder],
    }));
  };

  const toggleReminder = (id) => {
    setData((prevData) => ({
      ...prevData,
      reminders: prevData.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  };

  const addSavingsGoal = (newGoal) => {
    setData((prevData) => ({
      ...prevData,
      savings: {
        ...prevData.savings,
        goals: [...prevData.savings.goals, newGoal],
      },
    }));
  };

  const updateSavingsGoal = (updatedGoal) => {
    setData((prevData) => ({
      ...prevData,
      savings: {
        ...prevData.savings,
        goals: prevData.savings.goals.map((goal) =>
          goal.id === updatedGoal.id ? updatedGoal : goal
        ),
      },
    }));
  };

  const addMoneyToGoal = (goalId, amount) => {
    setData((prevData) => {
      const newGoals = prevData.savings.goals.map((goal) => {
        if (goal.id === goalId) {
          return {
            ...goal,
            current: (goal.current || 0) + amount,
            monthlyContributions: (goal.monthlyContributions || 0) + amount,
          };
        }
        return goal;
      });

      return {
        ...prevData,
        savings: {
          ...prevData.savings,
          current: prevData.savings.current + amount,
          monthlyContributions:
            (prevData.savings.monthlyContributions || 0) + amount,
          goals: newGoals,
        },
      };
    });
  };

  const deleteGoal = (goalId) => {
    setData((prevData) => {
      const goalToDelete = prevData.savings.goals.find((g) => g.id === goalId);
      if (!goalToDelete) return prevData;

      return {
        ...prevData,
        savings: {
          ...prevData.savings,
          current: prevData.savings.current - goalToDelete.current,
          monthlyContributions:
            prevData.savings.monthlyContributions -
            (goalToDelete.monthlyContributions || 0),
          goals: prevData.savings.goals.filter((g) => g.id !== goalId),
        },
      };
    });
  };

  const updateMonthlyGoal = (newGoalAmount) => {
    setData((prevData) => ({
      ...prevData,
      savings: { ...prevData.savings, monthlyGoal: parseFloat(newGoalAmount) },
    }));
  };

  const updateBudget = (newBudget) => {
    setData((prevData) => ({
      ...prevData,
      monthlyLimit: parseFloat(newBudget),
    }));
  };

  const updateProfileInfo = (newInfo) => {
    setData((prevData) => ({ ...prevData, ...newInfo }));
  };

  const handleExport = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (
            importedData.totalSalary !== undefined &&
            importedData.totalExpense !== undefined &&
            Array.isArray(importedData.entries)
          ) {
            setData(importedData);
          } else {
            alert("Invalid JSON format.");
          }
        } catch {
          alert("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData((prevData) => ({ ...prevData, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageClick = () => {
    imageInputRef.current.click();
  };

  const renderPage = () => {
    switch (currentPage) {
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
          />
        );
      case "add-expense":
        return (
          <AddTransactionPage
            type="expense"
            setCurrentPage={setCurrentPage}
            addTransaction={addTransaction}
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
          />
        );
      case "settings":
        return (
          <SettingsPage
            data={data}
            setData={setData}
            setCurrentPage={setCurrentPage}
            onExport={exportData}
          />
        );
      case "savings":
        return (
          <SavingsPage
            savings={data.savings}
            setCurrentPage={setCurrentPage}
            updateMonthlyGoal={updateMonthlyGoal}
            addMoneyToGoal={addMoneyToGoal}
          />
        );
      case "your-goals":
        return (
          <YourGoalsPage
            goals={data.savings.goals}
            setCurrentPage={setCurrentPage}
            updateSavingsGoal={updateSavingsGoal}
            addMoneyToGoal={addMoneyToGoal}
            deleteGoal={deleteGoal}
          />
        );
      case "add-goal":
        return (
          <AddGoalPage
            addSavingsGoal={addSavingsGoal}
            setCurrentPage={setCurrentPage}
          />
        );
      case "profile":
        return (
          <ProfilePage
            setCurrentPage={setCurrentPage}
            onExport={handleExport}
            onImportClick={handleImportClick}
            profileImage={data.profileImage}
            onImageChangeClick={handleProfileImageClick}
            userName={data.userName}
            userEmail={data.userEmail}
            updateProfileInfo={updateProfileInfo}
          />
        );
      case "expense-details":
        return (
          <ExpenseDetailsPage
            data={data}
            setCurrentPage={setCurrentPage}
            updateBudget={updateBudget}
            addTransaction={addTransaction}
          />
        );
      case "reminders":
        return (
          <ReminderPage
            reminders={data.reminders}
            setCurrentPage={setCurrentPage}
            addReminder={addReminder}
            toggleReminder={toggleReminder}
            hasGoals={data.savings.goals.length > 0}
          />
        );
      case "add-reminder":
        return (
          <SetReminderPage
            setCurrentPage={setCurrentPage}
            addReminder={addReminder}
            savingsGoals={data.savings.goals}
          />
        );
      case "notifications":
        return (
          <NotificationsPage
            notifications={data.notifications}
            setCurrentPage={setCurrentPage}
          />
        );
      case "budget":
        return (
          <BudgetPage
            data={data}
            setCurrentPage={setCurrentPage}
            updateBudget={updateBudget}
          />
        );
      case "overview":
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
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const importedData = JSON.parse(event.target.result);
                  if (
                    importedData.entries &&
                    Array.isArray(importedData.entries)
                  ) {
                    setData((prev) => ({
                      ...prev,
                      ...importedData,
                      settings: { ...prev.settings, ...importedData.settings },
                    }));
                    addNotification("Data imported successfully!", "success");
                  } else {
                    addNotification("Invalid file format", "error");
                  }
                } catch (error) {
                  addNotification("Failed to import data", "error");
                }
              };
              reader.readAsText(file);
            }
          }}
          className="hidden"
          accept="application/json"
        />

        <input
          type="file"
          ref={imageInputRef}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setData((prev) => ({
                  ...prev,
                  profileImage: event.target.result,
                }));
              };
              reader.readAsDataURL(file);
            }
          }}
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

// --- Page Components ---

// Overview Page Component - Mobile Optimized
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
    <main className="flex-grow p-3 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
      <SummaryCards analytics={analytics} setCurrentPage={setCurrentPage} />
      <ActionButtons
        activeAction={activeAction}
        setActiveAction={setActiveAction}
        setCurrentPage={setCurrentPage}
      />
      <LatestEntries
        entries={data.entries.slice(0, 4)}
        setCurrentPage={setCurrentPage}
      />
    </main>
  </>
);

// Analytics Page Component
const AnalyticsPage = ({ data, analytics, setCurrentPage }) => (
  <>
    <PageHeader title="Analytics" onBack={() => setCurrentPage("overview")} />
    <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpendingChart data={analytics} />
        <CategoryBreakdown data={analytics.categorySpending} />
        <SavingsProgress data={data.savings} />
        <MonthlyStats analytics={analytics} />
      </div>
    </main>
  </>
);

// Settings Page Component
const SettingsPage = ({ data, setData, setCurrentPage, onExport }) => {
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
                checked={data.settings?.notifications || false}
                onChange={(checked) => updateSetting("notifications", checked)}
              />
              <SettingToggle
                label="Auto Backup"
                description="Automatically backup your data"
                checked={data.settings?.autoBackup || false}
                onChange={(checked) => updateSetting("autoBackup", checked)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={data.settings?.currency || "USD"}
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
            </div>
          </div>

          {/* App Info */}
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h3 className="text-lg font-bold mb-4">App Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Version: {data.version || "2.0.0"}</p>
              <p>Total Entries: {data.entries?.length || 0}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

const AddPage = ({ setCurrentPage, entries }) => (
  <>
    <PageHeader
      title="Add Transaction"
      onBack={() => setCurrentPage("overview")}
    />
    <main className="flex-grow p-3 space-y-4 overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setCurrentPage("add-income")}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all"
        >
          <TrendingUp size={28} className="mx-auto mb-2" />
          <span className="block font-bold text-base">Add Income</span>
          <span className="block text-green-100 text-sm">
            Record money received
          </span>
        </button>

        <button
          onClick={() => setCurrentPage("add-expense")}
          className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform active:scale-95 transition-all"
        >
          <TrendingDown size={28} className="mx-auto mb-2" />
          <span className="block font-bold text-base">Add Expense</span>
          <span className="block text-red-100 text-sm">Record money spent</span>
        </button>
      </div>

      <LatestEntries entries={entries} setCurrentPage={setCurrentPage} />
    </main>
  </>
);

const AddTransactionPage = ({ type, setCurrentPage, addTransaction }) => {
  const [formData, setFormData] = useState({
    type: type === "income" ? "Salary" : "Food & Dining",
    amount: "",
    category: "Personal",
    description: "",
    paymentMethod: "Cash",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  const categories = type === "income" ? incomeCategories : expenseCategories;

  const validateForm = () => {
    const newErrors = {};

    if (!validateAmount(formData.amount)) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!validateText(formData.type)) {
      newErrors.type = "Please select a category";
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
      id: Date.now() + Math.random(),
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
      <main className="flex-grow p-3 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className={`p-2 rounded-lg text-sm font-medium transition-colors active:scale-95 ${
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all duration-200"
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
            {[...expenseCategories, ...incomeCategories]
              .slice(0, 5)
              .map((cat) => (
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

const AddTransactionForm = ({ type, addTransaction, setCurrentPage }) => {
  const expenseTitles = [
    { name: "Food", icon: "🍔" },
    { name: "Transport", icon: "🚲" },
    { name: "Lend", icon: "💸" },
    { name: "Gift", icon: "🎁" },
    { name: "Utilities", icon: "💡" },
    { name: "Clothe", icon: "👕" },
    { name: "Accesories", icon: "💍" },
    { name: "Donation", icon: "❤️" },
    { name: "Savings", icon: "💰" },
  ];

  const incomeTitles = [
    { name: "Salary", icon: "💰" },
    { name: "Gift", icon: "🎁" },
    { name: "Money Back", icon: "💸" },
  ];

  const [title, setTitle] = useState(type === "income" ? "Salary" : "Food");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Personal");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);

  const handleSubmit = () => {
    if (!title || !amount) {
      alert("Please fill in all fields.");
      return;
    }
    const newEntry = {
      id: Date.now(),
      type: title,
      date: selectedDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      amount: parseInt(amount, 10),
      paymentMethod: "Cash", // Updated from 'Card'
      transactionType: type,
      category: category,
    };
    addTransaction(newEntry);
    setCurrentPage("overview");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit();
  };

  const titleOptions = type === "income" ? incomeTitles : expenseTitles;

  return (
    <>
      <PageHeader
        title={type === "income" ? "Add Income" : "Add Expense"}
        onBack={() => setCurrentPage("add")}
      />
      <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
        <form
          onSubmit={handleFormSubmit}
          className="md:grid md:grid-cols-2 md:gap-8"
        >
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft size={20} />
                </button>
                <p className="font-bold text-gray-800">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setSelectedDate(newDate);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-4 mt-6 md:mt-0">
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Title
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                  className="w-full mt-1 p-3 bg-white border-2 border-[#1D41F9]/30 rounded-xl focus:outline-none focus:border-[#1D41F9] text-left flex justify-between items-center"
                >
                  <span>{title}</span>
                  <ChevronRight
                    className={`transform transition-transform ${
                      isTitleDropdownOpen ? "rotate-90" : ""
                    }`}
                    size={20}
                  />
                </button>
                {isTitleDropdownOpen && (
                  <div className="absolute w-full bg-white shadow-lg rounded-xl mt-1 z-20 max-h-48 overflow-y-auto">
                    {titleOptions.map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => {
                          setTitle(t.name);
                          setIsTitleDropdownOpen(false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-100 flex items-center"
                      >
                        <span className="mr-2">{t.icon}</span>
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 p-3 bg-white border-2 border-[#1D41F9]/30 rounded-xl focus:outline-none focus:border-[#1D41F9] pr-8"
                  placeholder="1,368"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Category
              </label>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {(type === "income" ? incomeCategories : expenseCategories).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-5 py-3 rounded-xl font-semibold transition-colors ${
                        category === cat
                          ? "bg-[#1D41F9] text-white"
                          : "bg-white text-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-[#1D41F9] text-white font-bold py-4 rounded-2xl shadow-lg mt-8"
            >
              ADD {type.toUpperCase()}
            </button>
          </div>
        </form>
      </main>
    </>
  );
};

const SavingsPage = ({
  savings,
  setCurrentPage,
  updateMonthlyGoal,
  addMoneyToGoal,
}) => {
  const [showMonthlyGoalModal, setShowMonthlyGoalModal] = useState(false);
  const [newMonthlyGoal, setNewMonthlyGoal] = useState(savings.monthlyGoal);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState("");

  const handleUpdateMonthlyGoal = (e) => {
    e.preventDefault();
    updateMonthlyGoal(newMonthlyGoal);
    setShowMonthlyGoalModal(false);
  };

  const handleAddMoneyClick = (goal) => {
    setSelectedGoal(goal);
    setShowAddMoneyModal(true);
  };

  const handleConfirmAddMoney = (e) => {
    e.preventDefault();
    addMoneyToGoal(selectedGoal.id, parseFloat(amountToAdd));
    setShowAddMoneyModal(false);
    setAmountToAdd("");
  };

  const percentage = Math.min(
    100,
    (savings.monthlyContributions / savings.monthlyGoal) * 100
  );

  return (
    <>
      <header className="flex items-center p-4 sm:p-6 bg-gray-100 flex-shrink-0 justify-between">
        <button
          onClick={() => setCurrentPage("overview")}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Savings</h1>
        <button
          onClick={() => setCurrentPage("your-goals")}
          className="text-sm font-semibold text-[#1D41F9]"
        >
          See All
        </button>
      </header>
      <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Current Savings</p>
          <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center bg-[#1D41F9] rounded-full shadow-lg">
            <span className="text-4xl font-bold text-white z-10">
              ${savings.current}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowMonthlyGoalModal(true)}
          className="w-full bg-white p-4 rounded-2xl shadow-sm"
        >
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <CalendarIcon size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">July 2024</p>
              <p className="text-sm text-gray-500">Goal for this Month</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
            <div
              className="bg-[#1D41F9] h-4 rounded-full relative"
              style={{ width: `${percentage}%` }}
            >
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>${savings.monthlyContributions || 0}</span>
            <span>${savings.monthlyGoal}</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Tap to update</p>
        </button>

        <YourGoals
          goals={savings.goals}
          setCurrentPage={setCurrentPage}
          isPreview={true}
          onGoalClick={handleAddMoneyClick}
        />

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <button
            onClick={() => setCurrentPage("add-goal")}
            className="w-full flex items-center justify-center py-4 text-[#1D41F9] font-semibold hover:bg-gray-50 rounded-xl transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add Goal
          </button>
        </div>
      </main>
      {showMonthlyGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleUpdateMonthlyGoal}
            className="bg-white p-6 rounded-2xl shadow-lg w-80"
          >
            <h3 className="text-lg font-bold mb-4">Update Monthly Goal</h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={newMonthlyGoal}
                onChange={(e) => setNewMonthlyGoal(e.target.value)}
                className="w-full p-3 pl-7 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowMonthlyGoalModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1D41F9] text-white font-semibold"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
      {showAddMoneyModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleConfirmAddMoney}
            className="bg-white p-6 rounded-2xl shadow-lg w-80"
          >
            <h3 className="text-lg font-bold mb-4">
              Add to "{selectedGoal.name}"
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                placeholder="1000"
                className="w-full p-3 pl-7 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddMoneyModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1D41F9] text-white font-semibold"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const YourGoalsPage = ({
  goals,
  setCurrentPage,
  addMoneyToGoal,
  deleteGoal,
}) => {
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [amountToAdd, setAmountToAdd] = useState("");

  const handleAddMoneyClick = (goal) => {
    setSelectedGoal(goal);
    setShowAddMoneyModal(true);
  };

  const handleDeleteClick = (goal) => {
    setSelectedGoal(goal);
    setShowDeleteModal(true);
  };

  const handleConfirmAddMoney = (e) => {
    e.preventDefault();
    addMoneyToGoal(selectedGoal.id, parseFloat(amountToAdd));
    setShowAddMoneyModal(false);
    setAmountToAdd("");
  };

  const handleConfirmDelete = () => {
    deleteGoal(selectedGoal.id);
    setShowDeleteModal(false);
  };

  return (
    <>
      <header className="flex items-center p-4 sm:p-6 bg-gray-100 flex-shrink-0 justify-between">
        <button
          onClick={() => setCurrentPage("savings")}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Your Goals</h1>
        <div className="w-10"></div>
      </header>
      <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <YourGoals
          goals={goals}
          setCurrentPage={setCurrentPage}
          onGoalClick={handleAddMoneyClick}
          onDeleteClick={handleDeleteClick}
        />
      </main>
      {showAddMoneyModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleConfirmAddMoney}
            className="bg-white p-6 rounded-2xl shadow-lg w-80"
          >
            <h3 className="text-lg font-bold mb-4">
              Add to "{selectedGoal.name}"
            </h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)}
                placeholder="1000"
                className="w-full p-3 pl-7 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAddMoneyModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1D41F9] text-white font-semibold"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
      {showDeleteModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-80">
            <h3 className="text-lg font-bold mb-4">Delete Goal</h3>
            <p>
              Are you sure you want to delete the goal "{selectedGoal.name}"?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const AddGoalPage = ({ addSavingsGoal, setCurrentPage }) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [contributionType, setContributionType] = useState("Yearly");
  const [deadline, setDeadline] = useState(new Date(2026, 3, 4));
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) {
      alert("Please fill in title and amount");
      return;
    }
    addSavingsGoal({
      id: Date.now(),
      name: title,
      current: 0,
      target: parseInt(amount),
      icon: "Wallet", // Placeholder icon
    });
    setCurrentPage("your-goals");
  };

  return (
    <>
      <PageHeader
        title="Add Goal"
        onBack={() => setCurrentPage("your-goals")}
      />
      <main className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
              placeholder="New house"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9] pr-8"
                placeholder="188,000"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
            </div>
          </div>
          <div className="relative">
            <label className="text-sm font-semibold text-gray-600">
              Contribution Type
            </label>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl text-left flex justify-between items-center"
            >
              <span>{contributionType}</span>
              <ChevronRight
                className={`transform transition-transform ${
                  showDropdown ? "rotate-90" : ""
                }`}
                size={20}
              />
            </button>
            {showDropdown && (
              <div className="absolute w-full bg-white shadow-lg rounded-xl mt-1 z-20">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setContributionType(type);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-100 flex justify-between items-center"
                  >
                    {type}
                    {contributionType === type && <Checkmark />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <label className="text-sm font-semibold text-gray-600">
              Deadline
            </label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl text-left flex justify-between items-center"
            >
              <span>{deadline.toLocaleDateString()}</span>
              <CalendarIcon size={20} className="text-gray-400" />
            </button>
            {showCalendar && (
              <div className="absolute w-full bg-white shadow-lg rounded-xl mt-1 z-20">
                <Calendar
                  selectedDate={deadline}
                  setSelectedDate={(date) => {
                    setDeadline(date);
                    setShowCalendar(false);
                  }}
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-[#1D41F9] text-white font-bold py-4 rounded-2xl shadow-lg mt-8"
          >
            ADD GOAL
          </button>
        </form>
      </main>
    </>
  );
};

const ProfilePage = ({
  setCurrentPage,
  onExport,
  onImportClick,
  profileImage,
  onImageChangeClick,
  userName,
  userEmail,
  updateProfileInfo,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);

  const handleSave = (e) => {
    e.preventDefault();
    updateProfileInfo({ userName: name, userEmail: email });
    setIsEditing(false);
  };

  return (
    <>
      <PageHeader title="Profile" onBack={() => setCurrentPage("overview")} />
      <main className="flex-grow p-4 sm:p-6 space-y-6 flex flex-col">
        <div className="flex flex-col items-center">
          <img
            src={profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
          <button
            onClick={onImageChangeClick}
            className="text-sm font-semibold text-[#1D41F9]"
          >
            Change Profile Image
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white p-4 rounded-2xl shadow-sm space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Personal Info</h3>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Pencil size={20} className="text-gray-600" />
              </button>
            )}
          </div>

          {isEditing ? (
            <>
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#1D41F9] text-white font-bold py-3 rounded-2xl shadow-lg"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-800">{userName}</p>
              </div>
              <hr />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-800">{userEmail}</p>
              </div>
            </>
          )}
        </form>

        <div className="bg-white p-4 rounded-2xl shadow-sm space-y-2">
          <button
            onClick={onImportClick}
            className="w-full text-left flex items-center px-4 py-3 text-lg text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <Upload className="mr-3 h-6 w-6" />
            Import Data
          </button>
          <button
            onClick={onExport}
            className="w-full text-left flex items-center px-4 py-3 text-lg text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <Download className="mr-3 h-6 w-6" />
            Export Data
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Follow on</h3>
          <div className="flex justify-center space-x-4">
            <a
              href="https://www.linkedin.com/in/md-rabbi-hossen-rabbi-b1bbb0326/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/mohammad.rahat.177570"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://github.com/md-rabbihossen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="mailto:rabbihossenrabbi24@gmail.com"
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M0 3v18h24V3H0zm21.518 2L12 12.713 2.482 5h19.036zM2 19V7.183l10 8.104 10-8.104V19H2z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-auto text-center text-gray-600 font-semibold text-sm pb-4">
          <p>
            © 2025 Expense Tracker. All rights reserved. Made by Md Rahat Hossen
          </p>
        </div>
      </main>
    </>
  );
};

const ExpenseDetailsPage = ({ data, setCurrentPage, updateBudget }) => {
  const [activeTab, setActiveTab] = useState("spends");
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState(data.monthlyLimit);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenseEntries = data.entries.filter((e) => {
    const entryDate = new Date(e.date);
    return (
      e.transactionType === "expense" &&
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear
    );
  });

  const currentMonthExpense = monthlyExpenseEntries.reduce(
    (acc, entry) => acc + entry.amount,
    0
  );

  const getChartData = (key) => {
    const groupedData = monthlyExpenseEntries.reduce((acc, entry) => {
      const groupKey = entry[key];
      if (!acc[groupKey]) {
        acc[groupKey] = 0;
      }
      acc[groupKey] += entry.amount;
      return acc;
    }, {});

    const chartData = Object.keys(groupedData).map((k) => ({
      name: k,
      amount: groupedData[k],
      percentage: (groupedData[k] / (currentMonthExpense || 1)) * 100,
    }));

    return chartData.sort((a, b) => b.percentage - a.percentage);
  };

  const spendsChartData = getChartData("type");
  const categoriesChartData = getChartData("category");

  const colors = [
    "#1D41F9",
    "#F97316",
    "#10B981",
    "#FBBF24",
    "#8B5CF6",
    "#EC4899",
  ];

  const handleUpdateBudget = (e) => {
    e.preventDefault();
    updateBudget(newBudget);
    setShowBudgetModal(false);
  };

  return (
    <>
      <PageHeader
        title="Monthly Expenses"
        onBack={() => setCurrentPage("overview")}
      />
      <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
        <Calendar selectedDate={new Date()} setSelectedDate={() => {}} />
        <button
          onClick={() => setShowBudgetModal(true)}
          className="text-center w-full"
        >
          <div className="relative w-40 h-40 mx-auto my-4 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 36 36">
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
                className="text-[#1D41F9]"
                strokeWidth="3"
                strokeDasharray={`${
                  (currentMonthExpense / data.monthlyLimit) * 100
                }, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="15.9155"
                cx="18"
                cy="18"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[#1D41F9]">
                ${Math.round(currentMonthExpense)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            You have spent{" "}
            {Math.round((currentMonthExpense / data.monthlyLimit) * 100)}% of
            your budget
          </p>
          <p className="text-sm text-gray-400 mt-2">Tap to update</p>
        </button>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Add Expense</h3>
            <button
              onClick={() => setCurrentPage("add-expense")}
              className="text-white bg-[#1D41F9] p-2 rounded-full"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="bg-white p-1 rounded-full flex justify-around shadow-sm">
          <button
            onClick={() => setActiveTab("spends")}
            className={`w-full py-2 rounded-full font-semibold ${
              activeTab === "spends"
                ? "bg-[#1D41F9] text-white"
                : "text-gray-600"
            }`}
          >
            Spends
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`w-full py-2 rounded-full font-semibold ${
              activeTab === "categories"
                ? "bg-[#1D41F9] text-white"
                : "text-gray-600"
            }`}
          >
            Categories
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm">
          {activeTab === "spends" && (
            <PieChart data={spendsChartData} colors={colors} />
          )}
          {activeTab === "categories" && (
            <PieChart data={categoriesChartData} colors={colors} />
          )}
        </div>

        <div className="space-y-4">
          {monthlyExpenseEntries.map((entry) => (
            <EntryItem key={entry.id} entry={entry} />
          ))}
        </div>
      </main>
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleUpdateBudget}
            className="bg-white p-6 rounded-2xl shadow-lg w-80"
          >
            <h3 className="text-lg font-bold mb-4">Update Monthly Budget</h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full p-3 pl-7 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1D41F9] text-white font-semibold"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

const ReminderPage = ({
  reminders,
  setCurrentPage,
  toggleReminder,
  hasGoals,
}) => {
  const [showNoGoalsModal, setShowNoGoalsModal] = useState(false);

  const handleAddClick = () => {
    if (hasGoals) {
      setCurrentPage("add-reminder");
    } else {
      setShowNoGoalsModal(true);
    }
  };

  return (
    <>
      <header className="flex items-center p-4 sm:p-6 bg-gray-100 flex-shrink-0 justify-between">
        <button
          onClick={() => setCurrentPage("overview")}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Reminder</h1>
        <button
          onClick={handleAddClick}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <Plus size={24} className="text-[#1D41F9]" />
        </button>
      </header>
      <main className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-bold text-gray-800">{reminder.title}</p>
              <p className="text-sm text-gray-500">{reminder.time}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminder.enabled}
                onChange={() => toggleReminder(reminder.id)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </main>
      {showNoGoalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-80 text-center">
            <h3 className="text-lg font-bold mb-4">No Savings Goals</h3>
            <p className="text-gray-600 mb-6">
              Please add a savings goal before setting a reminder.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowNoGoalsModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNoGoalsModal(false);
                  setCurrentPage("add-goal");
                }}
                className="px-4 py-2 rounded-lg bg-[#1D41F9] text-white font-semibold"
              >
                Go to Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SetReminderPage = ({ setCurrentPage, addReminder, savingsGoals }) => {
  const [goalTitle, setGoalTitle] = useState(savingsGoals[0]?.name || "");
  const [frequency, setFrequency] = useState("Monthly");
  const [deadline, setDeadline] = useState(new Date());
  const [time, setTime] = useState("12:00");

  const [showGoalDropdown, setShowGoalDropdown] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleSetReminder = (e) => {
    e.preventDefault();
    addReminder({
      id: Date.now(),
      title: goalTitle,
      frequency,
      date: deadline,
      time,
      enabled: true,
      triggered: false,
    });
    setCurrentPage("reminders");
  };

  return (
    <>
      <PageHeader
        title="Set Reminder"
        onBack={() => setCurrentPage("reminders")}
      />
      <main className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto">
        <form onSubmit={handleSetReminder}>
          <div className="relative">
            <label className="text-sm font-semibold text-gray-600">
              Goal Title
            </label>
            <button
              type="button"
              onClick={() => setShowGoalDropdown(!showGoalDropdown)}
              className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl text-left flex justify-between items-center"
            >
              <span>{goalTitle}</span>
              <ChevronRight
                className={`transform transition-transform ${
                  showGoalDropdown ? "rotate-90" : ""
                }`}
                size={20}
              />
            </button>
            {showGoalDropdown && (
              <div className="absolute w-full bg-white shadow-lg rounded-xl mt-1 z-30">
                {savingsGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => {
                      setGoalTitle(goal.name);
                      setShowGoalDropdown(false);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-100 flex justify-between items-center"
                  >
                    {goal.name}
                    {goalTitle === goal.name && <Checkmark />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative mt-4">
            <label className="text-sm font-semibold text-gray-600">
              Frequency
            </label>
            <button
              type="button"
              onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
              className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl text-left flex justify-between items-center"
            >
              <span>{frequency}</span>
              <ChevronRight
                className={`transform transition-transform ${
                  showFrequencyDropdown ? "rotate-90" : ""
                }`}
                size={20}
              />
            </button>
            {showFrequencyDropdown && (
              <div className="absolute w-full bg-white shadow-lg rounded-xl mt-1 z-20">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => {
                      setFrequency(freq);
                      setShowFrequencyDropdown(false);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-100 flex justify-between items-center"
                  >
                    {freq}
                    {frequency === freq && <Checkmark />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative mt-4">
            <label className="text-sm font-semibold text-gray-600">Date</label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl text-left flex justify-between items-center"
            >
              <span>{deadline.toLocaleDateString()}</span>
              <CalendarIcon size={20} className="text-gray-400" />
            </button>
            {showCalendar && (
              <div className="absolute w-full bg-white shadow-lg rounded-xl mt-1 z-20">
                <Calendar
                  selectedDate={deadline}
                  setSelectedDate={(date) => {
                    setDeadline(date);
                    setShowCalendar(false);
                  }}
                />
              </div>
            )}
          </div>
          <div className="mt-4">
            <label className="text-sm font-semibold text-gray-600">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1 p-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#1D41F9] text-white font-bold py-4 rounded-2xl shadow-lg mt-8"
          >
            SET REMINDER
          </button>
        </form>
      </main>
    </>
  );
};

const NotificationsPage = ({ notifications, setCurrentPage }) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const todayNotifs = notifications.filter(
    (n) => new Date(n.timestamp).toDateString() === today.toDateString()
  );
  const yesterdayNotifs = notifications.filter(
    (n) => new Date(n.timestamp).toDateString() === yesterday.toDateString()
  );
  const olderNotifs = notifications.filter(
    (n) =>
      new Date(n.timestamp).toDateString() !== today.toDateString() &&
      new Date(n.timestamp).toDateString() !== yesterday.toDateString()
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        onBack={() => setCurrentPage("overview")}
      />
      <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No notifications yet.
          </p>
        ) : (
          <>
            {todayNotifs.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Today</h3>
                <div className="space-y-3">
                  {todayNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-white p-4 rounded-2xl shadow-sm flex items-start gap-4"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 ${
                          !notif.read ? "bg-red-500" : "bg-transparent"
                        }`}
                      ></div>
                      <div>
                        <p className="text-gray-800">{notif.text}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(notif.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {yesterdayNotifs.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Yesterday</h3>
                <div className="space-y-3">
                  {yesterdayNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-white p-4 rounded-2xl shadow-sm flex items-start gap-4"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 ${
                          !notif.read ? "bg-red-500" : "bg-transparent"
                        }`}
                      ></div>
                      <div>
                        <p className="text-gray-800">{notif.text}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(notif.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {olderNotifs.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Older</h3>
                <div className="space-y-3">
                  {olderNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-white p-4 rounded-2xl shadow-sm flex items-start gap-4"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 ${
                          !notif.read ? "bg-red-500" : "bg-transparent"
                        }`}
                      ></div>
                      <div>
                        <p className="text-gray-800">{notif.text}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(notif.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

// --- Reusable Components ---

// --- Enhanced Components ---

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Settings Toggle Component
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

// Enhanced Header Component - Mobile Optimized
const Header = ({ setCurrentPage, profileImage, userName }) => (
  <header className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-2xl">
    <div className="flex-1">
      <h1 className="text-lg font-bold">
        Hello, {userName?.split(" ")[0] || "User"}! 👋
      </h1>
      <p className="text-blue-100 text-xs">Welcome back to your dashboard</p>
    </div>
    <div className="relative">
      <button
        onClick={() => setCurrentPage("settings")}
        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50 overflow-hidden border-2 border-white/30"
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

// Enhanced Page Header Component
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

// Enhanced Summary Cards Component - Mobile Optimized
const SummaryCards = ({ analytics, setCurrentPage }) => (
  <div className="space-y-4">
    {/* Main Balance Card - Full Width */}
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-white/20 rounded-full">
          <Wallet size={20} />
        </div>
        <TrendingUp size={18} className="text-blue-200" />
      </div>
      <p className="text-blue-100 text-sm">Total Balance</p>
      <p className="text-3xl font-bold mb-1">
        {formatCurrency(analytics.totalBalance)}
      </p>
      <p className="text-blue-100 text-xs">Available funds</p>
    </div>

    {/* Income and Expense Row - Mobile Optimized */}
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-4 rounded-2xl shadow-lg border-l-4 border-green-500">
        <div className="flex items-center mb-2">
          <div className="p-1.5 bg-green-100 rounded-lg mr-2">
            <TrendingUp size={16} className="text-green-600" />
          </div>
          <span className="text-xs text-gray-500">This Month</span>
        </div>
        <p className="text-gray-600 text-xs">Income</p>
        <p className="text-lg font-bold text-gray-800">
          {formatCurrency(analytics.monthlyIncome)}
        </p>
      </div>

      <button
        onClick={() => setCurrentPage("analytics")}
        className="bg-white p-4 rounded-2xl shadow-lg text-left hover:shadow-xl transition-shadow border-l-4 border-red-500"
      >
        <div className="flex items-center mb-2">
          <div className="p-1.5 bg-red-100 rounded-lg mr-2">
            <TrendingDown size={16} className="text-red-600" />
          </div>
          <BarChart3 size={14} className="text-gray-400" />
        </div>
        <p className="text-gray-600 text-xs">Expense</p>
        <p className="text-lg font-bold text-gray-800">
          {formatCurrency(analytics.monthlyExpense)}
        </p>
      </button>
    </div>
  </div>
);

// Quick Insights Component - Mobile Optimized
const QuickInsights = ({ analytics }) => (
  <div className="bg-white p-4 rounded-2xl shadow-lg">
    <h3 className="text-base font-bold text-gray-800 mb-3">Quick Insights</h3>
    <div className="grid grid-cols-2 gap-3">
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <div
          className={`text-xl font-bold ${
            analytics.savingsRate >= 20
              ? "text-green-600"
              : analytics.savingsRate >= 10
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {analytics.savingsRate.toFixed(1)}%
        </div>
        <p className="text-xs text-gray-600">Savings Rate</p>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-lg">
        <div className="text-xl font-bold text-blue-600">
          {Object.keys(analytics.categorySpending).length}
        </div>
        <p className="text-xs text-gray-600">Categories</p>
      </div>
    </div>
    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <p className="text-xs text-gray-700 text-center">
        {analytics.savingsRate >= 20
          ? "🎉 Excellent! You're saving well this month."
          : analytics.savingsRate >= 10
          ? "👍 Good savings rate. Try to increase it gradually."
          : "💡 Try to save more for better financial health."}
      </p>
    </div>
  </div>
);

// Enhanced Action Buttons Component - Mobile Optimized
const ActionButtons = ({ activeAction, setActiveAction, setCurrentPage }) => {
  const actions = [
    { id: "savings", label: "Savings", icon: Target, color: "blue" },
    { id: "analytics", label: "Analytics", icon: BarChart3, color: "green" },
    { id: "budget", label: "Budget", icon: Wallet, color: "purple" },
  ];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg">
      <div className="grid grid-cols-3 gap-2">
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
              className={`p-3 rounded-xl text-center transition-all transform active:scale-95 ${
                isActive
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} className="mx-auto mb-1" />
              <p className="text-xs font-semibold">{action.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Latest Entries Component - Mobile Optimized
const LatestEntries = ({ entries, setCurrentPage }) => (
  <div className="bg-white p-4 rounded-2xl shadow-lg">
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-base font-bold text-gray-800">Recent Transactions</h2>
      <button
        onClick={() => setCurrentPage("entries")}
        className="text-blue-500 text-sm font-semibold hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50"
      >
        View All
      </button>
    </div>
    <div className="space-y-2">
      {entries.slice(0, 4).map((entry) => (
        <EnhancedEntryItem key={entry.id} entry={entry} />
      ))}
      {entries.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No transactions yet.</p>
          <p className="text-xs text-gray-400">
            Start by adding your first transaction!
          </p>
        </div>
      )}
    </div>
  </div>
);

// Enhanced Entry Item Component - Mobile Optimized
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
      Food: "🍔",
      Transport: "🚗",
    };
    return iconMap[type] || "💵";
  };

  return (
    <div className="bg-gray-50 p-3 rounded-xl hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3 text-lg shadow-sm">
            {getIconForType(entry.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">
              {entry.type}
            </p>
            <div className="flex items-center text-xs text-gray-500">
              <span>{formatDate(entry.date)}</span>
              {entry.paymentMethod && (
                <>
                  <span className="mx-1">•</span>
                  <span>{entry.paymentMethod}</span>
                </>
              )}
            </div>
            {entry.description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {entry.description}
              </p>
            )}
          </div>
        </div>
        <div className="text-right ml-2">
          <p className={`font-bold text-sm ${colorClass}`}>
            {isExpense ? "-" : "+"} {formatCurrency(entry.amount)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Analytics Components
const SpendingChart = ({ data }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg">
    <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Overview</h3>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Income</span>
        <span className="font-semibold text-green-600">
          {formatCurrency(data.monthlyIncome)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Expenses</span>
        <span className="font-semibold text-red-600">
          {formatCurrency(data.monthlyExpense)}
        </span>
      </div>
      <div className="flex justify-between items-center pt-2 border-t">
        <span className="font-semibold text-gray-800">Net</span>
        <span
          className={`font-bold ${
            data.monthlyIncome - data.monthlyExpense >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {formatCurrency(data.monthlyIncome - data.monthlyExpense)}
        </span>
      </div>
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

const MonthlyStats = ({ analytics }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg">
    <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Statistics</h3>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Savings Rate</span>
        <span
          className={`font-semibold ${
            analytics.savingsRate >= 20
              ? "text-green-600"
              : analytics.savingsRate >= 10
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {analytics.savingsRate.toFixed(1)}%
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Total Balance</span>
        <span className="font-semibold text-blue-600">
          {formatCurrency(analytics.totalBalance)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Categories Used</span>
        <span className="font-semibold text-purple-600">
          {Object.keys(analytics.categorySpending).length}
        </span>
      </div>
    </div>
  </div>
);

// Enhanced Bottom Navigation - Mobile Optimized
const BottomNav = ({
  activeTab,
  setCurrentPage,
  unreadNotifications = false,
  setData,
}) => {
  const navItems = [
    { id: "overview", icon: Home, label: "Home" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "entries", icon: FileText, label: "Entries" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-t-2xl border-t border-gray-100">
      <div className="flex justify-around items-center py-2 px-1 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || activeTab.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center py-2 px-3 transition-all ${
                isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Add Button - Mobile Optimized */}
        <button
          onClick={() => setCurrentPage("add")}
          className="absolute left-1/2 -translate-x-1/2 -top-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-full shadow-xl border-4 border-white hover:shadow-2xl transform active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>
    </nav>
  );
};

const YourGoals = ({
  goals,
  setCurrentPage,
  isPreview = false,
  onGoalClick,
  onDeleteClick,
}) => (
  <div className="bg-white p-4 rounded-2xl shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800">Your Goals</h2>
      {isPreview ? (
        <button
          onClick={() => setCurrentPage("your-goals")}
          className="text-gray-500"
        >
          <MoreHorizontal size={24} />
        </button>
      ) : (
        <button
          onClick={() => setCurrentPage("add-goal")}
          className="text-white bg-[#1D41F9] p-2 rounded-full"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
    <div className="space-y-4">
      {(isPreview ? goals.slice(0, 2) : goals).map((goal) => {
        const GoalIcon = iconMap[goal.icon];
        const percentage = Math.min(100, (goal.current / goal.target) * 100);
        return (
          <div key={goal.id} className="w-full text-left">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  {GoalIcon && <GoalIcon size={20} className="text-gray-600" />}
                </div>
                <span className="font-semibold text-gray-800">{goal.name}</span>
              </div>
              <span className="font-semibold text-gray-600">
                ${goal.current} / ${goal.target}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div
                className="bg-[#1D41F9] h-4 rounded-full relative"
                style={{ width: `${percentage}%` }}
              >
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            {!isPreview && (
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => onGoalClick(goal)}
                  className="text-sm font-semibold text-blue-600"
                >
                  Add Money
                </button>
                <button
                  onClick={() => onDeleteClick(goal)}
                  className="text-sm font-semibold text-red-600"
                >
                  Delete
                </button>
              </div>
            )}
            {isPreview && (
              <button
                onClick={() => onGoalClick(goal)}
                className="text-sm text-gray-400 mt-2 hover:text-gray-600 transition-colors"
              >
                Tap to Add Money
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const Calendar = ({ selectedDate, setSelectedDate }) => {
  const [date, setDate] = useState(new Date());

  const daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const firstDayOfMonth = new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  ).getDay();
  const daysInMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  const changeMonth = (offset) => {
    setDate(new Date(date.getFullYear(), date.getMonth() + offset, 1));
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <p className="font-bold text-gray-800">
          {monthNames[date.getMonth()]} - {date.getFullYear()}
        </p>
        <button
          onClick={() => changeMonth(1)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-sm">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-gray-400 font-semibold">
            {day}
          </div>
        ))}
        {Array.from({
          length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1,
        }).map((_, i) => (
          <div key={`empty-${i}`}></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, d) => {
          const day = d + 1;
          const isSelected =
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === date.getMonth() &&
            selectedDate.getFullYear() === date.getFullYear();
          return (
            <button
              key={day}
              onClick={() =>
                setSelectedDate(
                  new Date(date.getFullYear(), date.getMonth(), day)
                )
              }
              className={`mt-2 p-2 rounded-lg ${
                isSelected ? "bg-[#1D41F9] text-white" : "hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const PieChart = ({ data, colors }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
      <svg width="150" height="150" viewBox="0 0 120 120">
        <g transform="rotate(-90 60 60)">
          {data.map((item, index) => {
            const dash = (item.percentage / 100) * circumference;
            const strokeDashoffset = offset;
            offset -= dash;
            return (
              <circle
                key={item.name}
                r={radius}
                cx="60"
                cy="60"
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </g>
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className="font-semibold mr-2">{item.name}:</span>
            <span>{item.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Checkmark = () => (
  <svg
    className="w-5 h-5 text-[#1D41F9]"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BudgetPage = ({ data, setCurrentPage, updateBudget }) => {
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState(data.monthlyLimit);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenseEntries = data.entries.filter((e) => {
    const entryDate = new Date(e.date);
    return (
      e.transactionType === "expense" &&
      entryDate.getMonth() === currentMonth &&
      entryDate.getFullYear() === currentYear
    );
  });

  const currentMonthExpense = monthlyExpenseEntries.reduce(
    (acc, entry) => acc + entry.amount,
    0
  );

  const handleUpdateBudget = (e) => {
    e.preventDefault();
    updateBudget(newBudget);
    setShowBudgetModal(false);
  };

  return (
    <>
      <PageHeader title="Budget" onBack={() => setCurrentPage("overview")} />
      <main className="flex-grow p-4 sm:p-6 space-y-6 overflow-y-auto">
        <button
          onClick={() => setShowBudgetModal(true)}
          className="bg-white p-6 rounded-2xl shadow-sm text-center w-full"
        >
          <p className="text-gray-500">Monthly Budget</p>
          <p className="text-4xl font-bold text-gray-800 my-2">
            ${data.monthlyLimit.toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Tap to update</p>
        </button>

        <div className="bg-white p-6 rounded-2xl shadow-sm text-center">
          <p className="text-gray-500 mb-4">Monthly Expense Progress</p>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 36 36">
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
                className="text-[#1D41F9]"
                strokeWidth="3"
                strokeDasharray={`${
                  (currentMonthExpense / data.monthlyLimit) * 100
                }, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="15.9155"
                cx="18"
                cy="18"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#1D41F9]">
                {Math.round((currentMonthExpense / data.monthlyLimit) * 100)}%
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            ${Math.round(currentMonthExpense)} of $
            {data.monthlyLimit.toFixed(0)} spent
          </p>
        </div>
      </main>
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form
            onSubmit={handleUpdateBudget}
            className="bg-white p-6 rounded-2xl shadow-lg w-80"
          >
            <h3 className="text-lg font-bold mb-4">Update Monthly Budget</h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full p-3 pl-7 bg-gray-100 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1D41F9]"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#1D41F9] text-white font-semibold"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
