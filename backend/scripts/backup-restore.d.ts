interface BackupOptions {
    outputPath?: string;
    compress?: boolean;
    includeData?: boolean;
    includeSchema?: boolean;
}
interface RestoreOptions {
    backupPath: string;
    dropExisting?: boolean;
    dataOnly?: boolean;
    schemaOnly?: boolean;
}
export declare function createBackup(options?: BackupOptions): Promise<string>;
export declare function restoreBackup(options: RestoreOptions): Promise<void>;
export declare function listBackups(): string[];
export declare function cleanOldBackups(keepCount?: number): void;
export {};
//# sourceMappingURL=backup-restore.d.ts.map