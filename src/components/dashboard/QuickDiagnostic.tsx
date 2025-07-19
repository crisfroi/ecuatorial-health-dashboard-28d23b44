import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useBasicConnectivityTest } from "@/hooks/useBasicConnectivityTest";
import { useProfessionalsTableTest } from "@/hooks/useProfessionalsTableTest";

const QuickDiagnostic = () => {
  const { data, isLoading, error, refetch } = useBasicConnectivityTest();
  const {
    data: tableData,
    isLoading: tableLoading,
    error: tableError,
    refetch: refetchTable,
  } = useProfessionalsTableTest();

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700">
          <AlertTriangle className="w-5 h-5" />
          Quick Database Diagnostic
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Testing...</span>
              </div>
            ) : data?.status === "success" ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Failed</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Basic Test
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchTable()}
                disabled={tableLoading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Table Test
              </Button>
            </div>
          </div>
        </div>

        {data?.status === "success" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-sm text-green-800">
              ✓ Database connection successful
            </div>
            <div className="text-xs text-green-600 mt-1">
              Records available: {data.recordCount || 0}
            </div>
          </div>
        )}

        {data?.status === "error" && data.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm font-medium text-red-800">
              Database Error:
            </div>
            <div className="text-xs text-red-700 mt-1">
              <div>Message: {data.error.message}</div>
              {data.error.details && <div>Details: {data.error.details}</div>}
              {data.error.hint && <div>Hint: {data.error.hint}</div>}
              {data.error.code && <div>Code: {data.error.code}</div>}
            </div>
          </div>
        )}

        {data?.status === "failed" && data.error && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="text-sm font-medium text-orange-800">
              Connection Error:
            </div>
            <div className="text-xs text-orange-700 mt-1">
              <div>Message: {data.error.message}</div>
              {data.error.name && <div>Type: {data.error.name}</div>}
              {data.error.cause && (
                <div>Cause: {JSON.stringify(data.error.cause)}</div>
              )}
            </div>

            {data.error.message?.includes("fetch") && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <div className="font-medium text-blue-800">
                  Possible solutions:
                </div>
                <ul className="list-disc list-inside text-blue-700 mt-1">
                  <li>Check internet connection</li>
                  <li>Verify Supabase project status</li>
                  <li>Check CORS settings</li>
                  <li>Verify API keys</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm font-medium text-red-800">Query Error:</div>
            <div className="text-xs text-red-700 mt-1">{error.message}</div>
          </div>
        )}

        {/* Table-specific test results */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Table Test Status:</span>
            {tableLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Testing table...</span>
              </div>
            ) : tableData?.status === "success" ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Table OK</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Table Issues</span>
              </div>
            )}
          </div>

          {tableData?.status === "success" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="text-sm text-green-800">
                ✓ Table tests successful
              </div>
              <div className="text-xs text-green-600 mt-1">
                <div>Total records: {tableData.totalRecords}</div>
                <div>Sample fetched: {tableData.sampleRecords}</div>
                {tableData.testResults && (
                  <div className="mt-2">
                    <div className="font-medium">Sub-tests:</div>
                    {tableData.testResults.map((test, i) => (
                      <div key={i} className="ml-2">
                        {test.success ? "✓" : "✗"} {test.name}:{" "}
                        {test.success ? `Count ${test.count}` : test.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {(tableData?.status === "failed" ||
            tableData?.status === "partial_success") &&
            tableData.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="text-sm font-medium text-red-800">
                  Table Test Failed at: {tableData.step}
                </div>
                <div className="text-xs text-red-700 mt-1">
                  <div>Message: {tableData.error.message}</div>
                  {tableData.error.details && (
                    <div>Details: {tableData.error.details}</div>
                  )}
                  {tableData.error.hint && (
                    <div>Hint: {tableData.error.hint}</div>
                  )}
                  {tableData.error.code && (
                    <div>Code: {tableData.error.code}</div>
                  )}
                  {tableData.count !== undefined && (
                    <div>Records found: {tableData.count}</div>
                  )}
                </div>
              </div>
            )}

          {tableData?.status === "error" && tableData.error && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="text-sm font-medium text-orange-800">
                Table Connection Error:
              </div>
              <div className="text-xs text-orange-700 mt-1">
                <div>Message: {tableData.error.message}</div>
                {tableData.error.name && (
                  <div>Type: {tableData.error.name}</div>
                )}
              </div>
            </div>
          )}

          {tableError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm font-medium text-red-800">
                Table Query Error:
              </div>
              <div className="text-xs text-red-700 mt-1">
                {tableError.message}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickDiagnostic;
