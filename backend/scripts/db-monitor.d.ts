interface DatabaseStats {
    connectionStatus: boolean;
    recordCounts: {
        techRequests: number;
        availableSlots: number;
        adminUsers: number;
        notificationLogs: number;
    };
    performance: {
        avgResponseTime: number;
        activeConnections: number;
        databaseSize: string;
    };
    indexUsage: Array<{
        tableName: string;
        indexName: string;
        scans: number;
        tuplesRead: number;
    }>;
    recentActivity: {
        requestsLastHour: number;
        slotsCreatedToday: number;
        notificationsSentToday: number;
    };
}
declare function getDatabaseStats(): Promise<DatabaseStats>;
declare function generateHealthReport(): Promise<void>;
declare function watchMode(intervalSeconds?: number): Promise<void>;
declare function exportMonitoringQueries(): void;
export { getDatabaseStats, generateHealthReport, watchMode, exportMonitoringQueries };
//# sourceMappingURL=db-monitor.d.ts.map