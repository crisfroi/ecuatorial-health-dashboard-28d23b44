import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi,
  WifiOff,
  Database,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Bug,
} from "lucide-react";
import { useSupabaseConnectivity } from "@/hooks/useSupabaseConnectivity";
import { useEstadisticasTest } from "@/hooks/useEstadisticasTest";

const ConnectionDebugPanel = () => {
  const {
    data: connectivityData,
    isLoading: connectivityLoading,
    error: connectivityError,
    refetch: refetchConnectivity,
  } = useSupabaseConnectivity();

  const {
    data: testData,
    isLoading: testLoading,
    error: testError,
    refetch: refetchTest,
  } = useEstadisticasTest();

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleRefreshAll = () => {
    refetchConnectivity();
    refetchTest();
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Bug className="w-5 h-5" />
          Connection Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between p-3 bg-white rounded border">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="font-medium">Network Status:</span>
          </div>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Environment Info */}
        <div className="p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">Environment:</h4>
          <div className="text-sm space-y-1">
            <div>URL: {currentUrl}</div>
            <div>
              User Agent:{" "}
              {typeof navigator !== "undefined"
                ? navigator.userAgent.substring(0, 50) + "..."
                : "Unknown"}
            </div>
          </div>
        </div>

        {/* Supabase Connectivity Test */}
        <div className="p-3 bg-white rounded border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Supabase Connectivity
            </h4>
            {connectivityLoading && (
              <RefreshCw className="w-4 h-4 animate-spin" />
            )}
          </div>

          {connectivityData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {connectivityData.status === "connected" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <Badge
                  variant={
                    connectivityData.status === "connected"
                      ? "default"
                      : "destructive"
                  }
                >
                  {connectivityData.status === "connected"
                    ? "Connected"
                    : "Failed"}
                </Badge>
              </div>

              {connectivityData.status === "connected" && (
                <div className="text-sm text-green-700">
                  <div>✓ Database accessible</div>
                  <div>
                    ✓ Records available:{" "}
                    {connectivityData.hasRecords ? "Yes" : "No"}
                  </div>
                  <div>✓ Record count: {connectivityData.recordCount}</div>
                </div>
              )}

              {connectivityData.status === "failed" && (
                <div className="text-sm text-red-700">
                  <div>✗ Error: {connectivityData.error}</div>
                  {connectivityData.details && (
                    <div className="mt-1 p-2 bg-red-100 rounded text-xs">
                      <div>Type: {connectivityData.details.type}</div>
                      <div>
                        Constructor: {connectivityData.details.constructor}
                      </div>
                      <div>
                        Has Message:{" "}
                        {connectivityData.details.hasMessage ? "Yes" : "No"}
                      </div>
                      <div>
                        Has Stack:{" "}
                        {connectivityData.details.hasStack ? "Yes" : "No"}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {connectivityError && (
            <div className="text-sm text-red-700">
              ✗ Connectivity Test Error: {connectivityError.message}
            </div>
          )}
        </div>

        {/* Advanced Test Results */}
        <div className="p-3 bg-white rounded border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Advanced Test Results</h4>
            {testLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </div>

          {testData && (
            <div className="text-sm text-green-700">
              ✓ Advanced test passed
              <div>Sample records: {testData.sampleData?.length || 0}</div>
            </div>
          )}

          {testError && (
            <div className="text-sm text-red-700">
              ✗ Advanced test failed: {testError.message}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <Button
          onClick={handleRefreshAll}
          className="w-full"
          disabled={connectivityLoading || testLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All Tests
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConnectionDebugPanel;
