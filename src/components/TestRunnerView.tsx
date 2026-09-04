/**
 * HelpDesk Lite (V1 MVP)
 * Interactive HDL-06 Unit Test Suite Runner & Verification Dashboard
 */

import React, { useState, useEffect, useTransition } from 'react';
import { runLifecycleTestSuite, TestSuiteSummary } from '../engine/stateMachine.test';
import { CheckCircle, XCircle, Play, RefreshCw, ShieldAlert, Cpu } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [report, setReport] = useState<TestSuiteSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');

  const executeTests = () => {
    startTransition(() => {
      const summary = runLifecycleTestSuite();
      setReport(summary);
    });
  };

  useEffect(() => {
    executeTests();
  }, []);

  const filteredResults = report?.results.filter((res) => {
    if (filter === 'PASSED') return res.passed;
    if (filter === 'FAILED') return !res.passed;
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              HDL-06 Verification Test Suite
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evidence-based validation covering transitions, illegal jumps, RBAC, single ownership, and terminal immutability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-run-tests"
            onClick={executeTests}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            Run All Tests
          </button>
        </div>
      </div>

      {/* Summary Scorecard */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 border-b border-slate-100 bg-white">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Total Tests</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{report.total}</div>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
            <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">Passed</div>
            <div className="text-xl font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1.5">
              <span>{report.passed}</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200">
            <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wide">Failed</div>
            <div className="text-xl font-extrabold text-rose-700 mt-0.5 flex items-center gap-1.5">
              <span>{report.failed}</span>
              {report.failed > 0 && <XCircle className="w-4 h-4 text-rose-600" />}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Execution Time</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{report.durationMs} ms</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs">
        <div className="flex gap-2">
          {(['ALL', 'PASSED', 'FAILED'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === mode
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="text-slate-400 text-[11px]">
          Showing {filteredResults?.length ?? 0} of {report?.total ?? 0} test cases
        </div>
      </div>

      {/* Test Case Listing */}
      <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto font-mono text-xs">
        {filteredResults?.map((test, index) => (
          <div
            key={index}
            className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-4 transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {test.passed ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-sans">
                    {test.category}
                  </span>
                  <span
                    className={`font-medium ${
                      test.passed ? 'text-slate-800' : 'text-rose-700 font-bold'
                    }`}
                  >
                    {test.name}
                  </span>
                </div>
                {test.error && (
                  <div className="mt-1.5 p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                    {test.error}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0">
              {test.durationMs}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
