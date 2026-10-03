import React, { useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  Database,
  Play,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Table as TableIcon,
  Layers,
  Code2,
  BookOpen,
  Search,
  RefreshCw,
  Eye,
  Key,
  ExternalLink,
  UserPlus,
  CreditCard,
  PlusCircle,
  X,
  FileCode,
} from 'lucide-react';

interface DbmsVivaConsoleProps {
  initialTable?: string;
  onOpenSignUp?: () => void;
  onOpenPlans?: () => void;
  onOpenAdminPlans?: () => void;
}

interface TableMetadata {
  name: string;
  rowCount: number;
  columns: { name: string; type: string; pk: boolean; notnull: boolean }[];
  rows: Record<string, any>[];
  pkColumn: string;
}

export const DbmsVivaConsole: React.FC<DbmsVivaConsoleProps> = ({
  initialTable,
  onOpenSignUp,
  onOpenPlans,
  onOpenAdminPlans,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'tables-viewer' | 'query-runner' | 'er-diagram' | 'theory-guide'>('tables-viewer');

  // Backend Tables state
  const [tablesData, setTablesData] = useState<Record<string, TableMetadata> | null>(null);
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [selectedTable, setSelectedTable] = useState<string>(initialTable || 'users');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [selectedRowDetail, setSelectedRowDetail] = useState<Record<string, any> | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string>('');

  // Query Runner states
  const [sqlInput, setSqlInput] = useState<string>(
    `SELECT u.name AS customer_name, p.plan_name, s.start_date, s.end_date, s.status\nFROM subscriptions s\nINNER JOIN users u ON s.user_id = u.user_id\nINNER JOIN plans p ON s.plan_id = p.plan_id\nORDER BY s.subscription_id DESC;`
  );
  const [demoQueries, setDemoQueries] = useState<any[]>([]);
  const [executing, setExecuting] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    executionTimeMs: number;
    message?: string;
  } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Schema state
  const [resetting, setResetting] = useState(false);

  // Load all tables data from backend
  const fetchTablesData = async (silent = false) => {
    if (!silent) setLoadingTables(true);
    try {
      const res = await api.dbms.getTablesData();
      setTablesData(res.tables);
      setLastFetchedAt(new Date(res.fetchedAt).toLocaleTimeString());
      if (silent) {
        toast.success('Live database records refreshed from SQLite engine.');
      }
    } catch (err: any) {
      console.error('Failed to load tables data:', err);
      toast.error('Failed to load backend tables data.');
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchTablesData();
    api.dbms.getDemoQueries().then((res) => setDemoQueries(res.queries));
  }, []);

  useEffect(() => {
    if (initialTable) {
      setSelectedTable(initialTable);
      setActiveTab('tables-viewer');
    }
  }, [initialTable]);

  const handleRunQuery = async () => {
    if (!sqlInput.trim()) return;
    setExecuting(true);
    setQueryError(null);

    try {
      const res = await api.dbms.runQuery(sqlInput);
      setQueryResult(res);
      toast.success(`Executed in ${res.executionTimeMs}ms (${res.rowCount} rows returned).`);
    } catch (err: any) {
      setQueryError(err.message || 'SQL Execution Error');
      setQueryResult(null);
    } finally {
      setExecuting(false);
    }
  };

  const handleSelectDemoQuery = (q: any) => {
    setSqlInput(q.sql);
  };

  const handleJumpToSqlForTable = (tableName: string) => {
    setSqlInput(`SELECT * FROM ${tableName} ORDER BY 1 DESC;`);
    setActiveTab('query-runner');
  };

  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset the database to pristine seed data? This will re-run schema.sql and seed.sql.'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      await api.dbms.resetDatabase();
      toast.success('Database re-initialized to default presentation seed state.', 'Reset Complete');
      await fetchTablesData(false);
      handleRunQuery();
    } catch (err: any) {
      toast.error('Failed to reset database.');
    } finally {
      setResetting(false);
    }
  };

  const currentTableMeta = tablesData ? tablesData[selectedTable] : null;

  // Filter rows based on search
  const filteredRows = currentTableMeta
    ? currentTableMeta.rows.filter((row) => {
        if (!tableSearch.trim()) return true;
        const q = tableSearch.toLowerCase();
        return Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        );
      })
    : [];

  const getTableDescription = (name: string) => {
    switch (name) {
      case 'users':
        return 'Stores registered account profiles, credentials, and access roles. Subscribed plan details (plan name, subscription status, price, and validity end date) are joined live directly beside each user record.';
      case 'subscriptions':
        return 'Active and past memberships linking customers (user_id FK) to plans (plan_id FK) with validity dates and statuses.';
      case 'plans':
        return 'Tier specifications configured by the admin including prices, billing cycle durations, and feature entitlements.';
      case 'payments':
        return 'Financial transaction ledger tracking payment amounts, payment methods (UPI/Card), transaction references, and statuses.';
      case 'subscription_history':
        return 'Audit log preserving the lifecycle changes of each subscription (Created, Renewed, Upgraded, Cancelled).';
      case 'system_settings':
        return 'Global configuration key-value pairs governing subscription validity thresholds.';
      default:
        return 'Relational database entity storing application records.';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold mb-2 border border-emerald-400/20">
            <Database className="w-3.5 h-3.5" />
            <span>SQLite3 ACID Relational Engine</span>
          </div>
          <h1 className="font-['Outfit',sans-serif] text-2xl sm:text-3xl font-extrabold tracking-tight">
            Backend Database & Storage Inspector
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Inspect real-time records stored in backend tables, verify new information entered in the UI, execute custom SQL queries, and review the schema.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchTablesData(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh Tables</span>
          </button>

          <button
            id="btn-reset-database"
            disabled={resetting}
            onClick={handleResetDatabase}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Restore pristine seed state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetting ? 'Resetting...' : 'Reset to Seed'}</span>
          </button>
        </div>
      </div>

      {/* TEACHER EVALUATION QUICK GUIDE BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-950 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-indigo-900">
              Evaluator Verification Workflow
            </h3>
          </div>
          <p className="text-xs text-indigo-800 leading-relaxed max-w-2xl">
            <strong>Step 1:</strong> Enter information in the UI forms (Register a user, Subscribe to a plan, or Create a plan).<br />
            <strong>Step 2:</strong> Check the table below to verify the exact record inserted into SQLite with Primary Key, Foreign Keys, and Timestamps!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSignUp && (
            <button
              onClick={onOpenSignUp}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Enter User Info</span>
            </button>
          )}

          {onOpenPlans && (
            <button
              onClick={onOpenPlans}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-900 border border-indigo-300 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Enter Subscription</span>
            </button>
          )}

          {onOpenAdminPlans && (
            <button
              onClick={onOpenAdminPlans}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-indigo-900 border border-indigo-300 font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Enter New Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 text-sm font-semibold overflow-x-auto">
        <button
          id="tab-tables-viewer"
          onClick={() => setActiveTab('tables-viewer')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'tables-viewer'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>Live Backend Tables</span>
        </button>

        <button
          id="tab-query-runner"
          onClick={() => setActiveTab('query-runner')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'query-runner'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>SQL Query Runner</span>
        </button>

        <button
          id="tab-er-diagram"
          onClick={() => setActiveTab('er-diagram')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'er-diagram'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ER Diagram & Relational Schema</span>
        </button>

        <button
          id="tab-theory-guide"
          onClick={() => setActiveTab('theory-guide')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'theory-guide'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Architecture & Normalization</span>
        </button>
      </div>

      {/* TAB 1: LIVE BACKEND TABLES EXPLORER */}
      {activeTab === 'tables-viewer' && (
        <div className="space-y-6">
          {/* Table Selector Pills */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Backend Database Table to Inspect:
              </span>
              {lastFetchedAt && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Last verified: {lastFetchedAt}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {tablesData ? (
                Object.keys(tablesData).map((tblName) => {
                  const meta = tablesData[tblName];
                  const isSelected = selectedTable === tblName;
                  return (
                    <button
                      key={tblName}
                      onClick={() => {
                        setSelectedTable(tblName);
                        setTableSearch('');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      <span>{tblName}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans font-bold ${
                          isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {meta.rowCount} rows
                      </span>
                    </button>
                  );
                })
              ) : (
                <span className="text-xs text-slate-400">Loading tables metadata...</span>
              )}
            </div>
          </div>

          {/* Table Details & Content */}
          {loadingTables || !currentTableMeta ? (
            <div className="py-20 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
              Querying database table <code className="font-mono text-indigo-600 font-bold">{selectedTable}</code>...
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900 font-mono">
                      Table: {currentTableMeta.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {currentTableMeta.rowCount} Total Records
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                      PK: {currentTableMeta.pkColumn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {getTableDescription(currentTableMeta.name)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleJumpToSqlForTable(currentTableMeta.name)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Query this table with SQL"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Run SQL on Table</span>
                  </button>
                </div>
              </div>

              {/* Column Schema Pills */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Table Schema Definition ({currentTableMeta.columns.length} columns):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {currentTableMeta.columns.map((col) => (
                    <span
                      key={col.name}
                      className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border ${
                        col.pk
                          ? 'bg-amber-50 text-amber-900 border-amber-200 font-bold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {col.pk && <Key className="w-3 h-3 text-amber-600" />}
                      <span>{col.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({col.type})</span>
                      {col.notnull && <span className="text-[9px] text-rose-500 font-semibold">*NN</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Search in table */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search within ${currentTableMeta.name} records...`}
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                  {tableSearch && (
                    <button
                      onClick={() => setTableSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="text-xs text-slate-500 font-mono">
                  Showing {filteredRows.length} of {currentTableMeta.rowCount} records
                </span>
              </div>

              {/* Special Note for Users Table showing Joined Subscription Details */}
              {currentTableMeta.name === 'users' && (
                <div className="p-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs text-indigo-950 flex-wrap gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>Subscription Details Linked Beside Users:</strong> When someone subscribes to a plan, their <strong>Subscribed Plan</strong>, <strong>Status</strong>, <strong>Price</strong>, and <strong>End Date</strong> appear directly beside their user details in this table.
                    </span>
                  </div>
                  {onOpenPlans && (
                    <button
                      onClick={onOpenPlans}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>+ Subscribe a User</span>
                    </button>
                  )}
                </div>
              )}

              {/* Data Grid Table */}
              {filteredRows.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  No records match your search query.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/90 text-slate-700 font-mono uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 whitespace-nowrap text-slate-400">#</th>
                        {currentTableMeta.columns.map((col) => {
                          const isRelational = col.type.includes('RELATIONAL');
                          return (
                            <th
                              key={col.name}
                              className={`py-2.5 px-3 whitespace-nowrap ${
                                isRelational ? 'bg-indigo-100/70 text-indigo-950 font-sans' : ''
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                {col.pk && <Key className="w-3 h-3 text-amber-600" />}
                                {isRelational && <Sparkles className="w-3 h-3 text-amber-500" />}
                                <span>{col.name}</span>
                              </span>
                            </th>
                          );
                        })}
                        <th className="py-2.5 px-3 text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {filteredRows.map((row, idx) => {
                        const isLatest = idx === 0 && !tableSearch;
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors ${
                              isLatest ? 'bg-emerald-50/50 hover:bg-emerald-50' : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {isLatest ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white font-sans">
                                  LATEST
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </td>

                            {currentTableMeta.columns.map((col) => {
                              const rawVal = row[col.name];
                              const isPassword = col.name === 'password_hash';
                              const isRelational = col.type.includes('RELATIONAL');

                              let displayVal: React.ReactNode = String(rawVal ?? '');
                              if (rawVal === null || rawVal === undefined) {
                                displayVal = <span className="text-slate-300 italic">NULL</span>;
                              } else if (isPassword) {
                                displayVal = (
                                  <span
                                    className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                                    title={String(rawVal)}
                                  >
                                    $2a$10$... (Bcrypt Hashed)
                                  </span>
                                );
                              } else if (col.name === 'subscribed_plan') {
                                if (rawVal && rawVal !== 'No Active Plan') {
                                  displayVal = (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-sans bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-2xs">
                                      <Sparkles className="w-3 h-3 text-amber-500" />
                                      <span>{String(rawVal)}</span>
                                    </span>
                                  );
                                } else {
                                  displayVal = (
                                    <span className="text-[10px] text-slate-400 italic bg-slate-50 border border-slate-100 px-2 py-0.5 rounded font-sans">
                                      No Subscription (Free)
                                    </span>
                                  );
                                }
                              } else if (col.name === 'subscription_status') {
                                if (rawVal) {
                                  const s = String(rawVal).toLowerCase();
                                  const color =
                                    s === 'active'
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      : s === 'expiring_soon'
                                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200';
                                  displayVal = (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans border ${color}`}>
                                      ● {String(rawVal)}
                                    </span>
                                  );
                                } else {
                                  displayVal = <span className="text-slate-300">-</span>;
                                }
                              } else if (col.name === 'plan_price') {
                                if (rawVal !== null && rawVal !== undefined) {
                                  displayVal = <span className="font-bold text-slate-900 font-sans">₹{Number(rawVal).toFixed(2)}</span>;
                                } else {
                                  displayVal = <span className="text-slate-300">-</span>;
                                }
                              } else if (col.name === 'subscription_start' || col.name === 'subscription_end') {
                                if (rawVal) {
                                  displayVal = (
                                    <span className="text-[11px] text-slate-700 font-mono">
                                      {col.name === 'subscription_end' ? `Ends ${rawVal}` : String(rawVal)}
                                    </span>
                                  );
                                } else {
                                  displayVal = <span className="text-slate-300">-</span>;
                                }
                              } else if (col.name === 'active_subscription_id') {
                                if (rawVal) {
                                  displayVal = (
                                    <button
                                      onClick={() => {
                                        setSelectedTable('subscriptions');
                                        setTableSearch(String(rawVal));
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-all cursor-pointer font-bold"
                                      title="Jump to this subscription in subscriptions table"
                                    >
                                      <span>#sub_{rawVal}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </button>
                                  );
                                } else {
                                  displayVal = <span className="text-slate-300">-</span>;
                                }
                              } else if (col.name === 'status' || col.name === 'payment_status') {
                                const s = String(rawVal).toLowerCase();
                                const color =
                                  s === 'active' || s === 'successful'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : s === 'expiring_soon'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700';
                                displayVal = (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${color}`}>
                                    {String(rawVal)}
                                  </span>
                                );
                              } else if (col.name === 'role') {
                                displayVal = (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-bold ${
                                      rawVal === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {String(rawVal)}
                                  </span>
                                );
                              } else if (col.name === 'price' || col.name === 'amount') {
                                displayVal = <span className="font-bold text-slate-900">₹{Number(rawVal).toFixed(2)}</span>;
                              } else if (col.name === 'auto_renew') {
                                displayVal = (
                                  <span className={rawVal ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                                    {rawVal ? '1 (Yes)' : '0 (No)'}
                                  </span>
                                );
                              }

                              return (
                                <td
                                  key={col.name}
                                  className={`py-2.5 px-3 whitespace-nowrap text-slate-800 ${
                                    isRelational ? 'bg-indigo-50/20' : ''
                                  }`}
                                >
                                  {displayVal}
                                </td>
                              );
                            })}

                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                onClick={() => setSelectedRowDetail(row)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                title="Inspect raw JSON record"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE SQL QUERY RUNNER */}
      {activeTab === 'query-runner' && (
        <div className="space-y-6">
          {/* Quick Pre-built Queries */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="font-['Outfit',sans-serif] text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Pre-Built Database Demonstration Queries (1-Click Load):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {demoQueries.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSelectDemoQuery(q)}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 group-hover:text-indigo-600">
                      {q.title}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {q.concept}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono line-clamp-1">
                    {q.sql.replace(/\n/g, ' ')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* SQL Editor Area */}
          <div className="bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-300 font-bold ml-2">SQLite Relational Engine SQL Console</span>
              </div>

              <button
                id="btn-execute-sql"
                disabled={executing}
                onClick={handleRunQuery}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{executing ? 'Executing SQL...' : 'Run SQL Query'}</span>
              </button>
            </div>

            <textarea
              id="sql-editor-textarea"
              rows={6}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="Write any SQL query (SELECT, JOIN, GROUP BY, INSERT, UPDATE)..."
              className="w-full bg-slate-950 text-emerald-300 font-mono text-xs sm:text-sm p-4 rounded-xl border border-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Execution Error Banner */}
          {queryError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-mono">
              <p className="font-bold mb-1">SQL Execution Failed:</p>
              <p>{queryError}</p>
            </div>
          )}

          {/* Results Table */}
          {queryResult && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-['Outfit',sans-serif] text-base font-bold text-slate-900">
                    Query Results
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {queryResult.rowCount} Rows Returned
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Executed in {queryResult.executionTimeMs}ms</span>
                </div>
              </div>

              {queryResult.columns.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  {queryResult.message || 'Query executed successfully with no returned rows.'}
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-mono uppercase font-bold border-b border-slate-200">
                      <tr>
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          {queryResult.columns.map((col, cIdx) => (
                            <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : (
                                <span className="text-slate-300 italic">NULL</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ER DIAGRAM & RELATIONAL SCHEMA */}
      {activeTab === 'er-diagram' && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div>
              <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
                Entity-Relationship (ER) Architecture
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing entity relationships, primary keys (PK), foreign keys (FK), and referential actions.
              </p>
            </div>

            {/* Visual Schema Box Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Table: users */}
              <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                  <span className="font-bold text-indigo-900 font-mono text-sm">users</span>
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 rounded font-bold">1</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <p className="text-indigo-700 font-bold">🔑 user_id (PK, AUTO)</p>
                  <p className="text-slate-700">name (VARCHAR)</p>
                  <p className="text-slate-700">email (UNIQUE)</p>
                  <p className="text-slate-700">phone (VARCHAR)</p>
                  <p className="text-slate-700">password_hash (TEXT)</p>
                  <p className="text-slate-700">role ('user' | 'admin')</p>
                  <p className="text-slate-700">status ('active' | 'suspended')</p>
                  <p className="text-slate-700">created_at (DATETIME)</p>
                </div>
              </div>

              {/* Table: plans */}
              <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50/40 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <span className="font-bold text-amber-900 font-mono text-sm">plans</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 rounded font-bold">1</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <p className="text-amber-700 font-bold">🔑 plan_id (PK, AUTO)</p>
                  <p className="text-slate-700">plan_name (VARCHAR)</p>
                  <p className="text-slate-700">price (DECIMAL)</p>
                  <p className="text-slate-700">duration_days (INT)</p>
                  <p className="text-slate-700">billing_cycle (ENUM)</p>
                  <p className="text-slate-700">features (JSON/TEXT)</p>
                  <p className="text-slate-700">max_users (INT)</p>
                </div>
              </div>

              {/* Table: subscriptions */}
              <div className="p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/40 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <span className="font-bold text-emerald-900 font-mono text-sm">subscriptions</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 rounded font-bold">N</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <p className="text-emerald-700 font-bold">🔑 subscription_id (PK)</p>
                  <p className="text-indigo-700 font-bold">🔗 user_id (FK → users)</p>
                  <p className="text-amber-700 font-bold">🔗 plan_id (FK → plans)</p>
                  <p className="text-slate-700">start_date (DATE)</p>
                  <p className="text-slate-700">end_date (DATE)</p>
                  <p className="text-slate-700">status (CHECK constraint)</p>
                  <p className="text-slate-700">auto_renew (TINYINT 0/1)</p>
                </div>
              </div>

              {/* Table: payments & history */}
              <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/40 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                  <span className="font-bold text-rose-900 font-mono text-sm">payments</span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 rounded font-bold">N</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <p className="text-rose-700 font-bold">🔑 payment_id (PK)</p>
                  <p className="text-emerald-700 font-bold">🔗 subscription_id (FK)</p>
                  <p className="text-indigo-700 font-bold">🔗 user_id (FK → users)</p>
                  <p className="text-slate-700">amount (DECIMAL)</p>
                  <p className="text-slate-700">payment_method (VARCHAR)</p>
                  <p className="text-slate-700">transaction_id (UNIQUE)</p>
                  <p className="text-slate-700">payment_status (ENUM)</p>
                </div>
              </div>
            </div>

            {/* Relationship Cardinalities */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-slate-800">Relational Constraints & Referential Actions:</h4>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                <li>
                  <strong className="text-slate-900">users (1) ───&lt; (N) subscriptions:</strong> One customer can hold multiple subscriptions across time. Foreign key constraint: <code className="text-indigo-600 font-mono">ON DELETE RESTRICT</code> ensures user records with active billing history cannot be accidentally pruned.
                </li>
                <li>
                  <strong className="text-slate-900">plans (1) ───&lt; (N) subscriptions:</strong> One plan can be subscribed to by multiple users. Deleting a plan referenced by active subscriptions triggers a Foreign Key restriction.
                </li>
                <li>
                  <strong className="text-slate-900">subscriptions (1) ───&lt; (N) payments:</strong> Every renewal or initial subscription creates a correlated payment row maintaining payment_id, transaction_id, and timestamp.
                </li>
                <li>
                  <strong className="text-slate-900">subscriptions (1) ───&lt; (N) subscription_history:</strong> Immutable audit ledger recording whenever an upgrade, renewal, or cancellation is transacted.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: THEORY & ARCHITECTURE GUIDE */}
      {activeTab === 'theory-guide' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="font-['Outfit',sans-serif] text-xl font-bold text-slate-900">
              Database Architecture & Normalization Guide
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Core technical principles regarding relational schema design, 3NF normalization, and ACID transaction compliance.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Q1: How is Normalization (1NF, 2NF, 3NF) applied in this project?
              </h3>
              <p className="text-slate-700 leading-relaxed">
                <strong>1NF (First Normal Form):</strong> Every column contains atomic values. There are no repeating groups.
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>2NF (Second Normal Form):</strong> Table is in 1NF and all non-key attributes are fully functionally dependent on the primary key.
              </p>
              <p className="text-slate-700 leading-relaxed">
                <strong>3NF (Third Normal Form):</strong> Table is in 2NF and has no transitive dependencies. Rather than storing Plan Name, Price, and Duration repeatedly inside each row of the <code className="font-mono">subscriptions</code> table, we separated them into the <code className="font-mono">plans</code> entity and reference only the foreign key <code className="font-mono">plan_id</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">
                Q2: How are ACID properties preserved during subscription payments?
              </h3>
              <p className="text-slate-700 leading-relaxed">
                Subscribing involves multiple queries: (1) inserting a new row into <code className="font-mono">subscriptions</code>, (2) inserting a corresponding row into <code className="font-mono">payments</code>, and (3) logging an audit event in <code className="font-mono">subscription_history</code>.
              </p>
              <p className="text-slate-700 leading-relaxed">
                These are wrapped inside an atomic SQL transaction: <code className="font-mono bg-slate-200 px-1 rounded">BEGIN TRANSACTION ... COMMIT</code>. If any step fails, a <code className="font-mono bg-slate-200 px-1 rounded">ROLLBACK</code> executes, ensuring Atomicity and Consistency.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT RECORD JSON */}
      {selectedRowDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedRowDetail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Record Inspector: {selectedTable}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {Object.entries(selectedRowDetail).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="font-mono text-[11px] font-bold text-indigo-700">{k}:</span>
                  <span className="font-mono text-slate-800 break-all mt-0.5">
                    {v !== null && v !== undefined ? String(v) : 'NULL'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedRowDetail(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Close Record View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
