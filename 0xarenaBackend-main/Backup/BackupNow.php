<?php
require_once __DIR__ . '/../config.php';

try {
    // Create PDO connection using the centralized config
    $pdo = getDbConnection();

    // Get all tables in the database
    $tables = [];
    $result = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    while ($row = $result->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    $backupContent = "";

    // Loop through tables and generate SQL statements
    foreach ($tables as $table) {
        $backupContent .= "DROP TABLE IF EXISTS \"$table\" CASCADE;\n";
        
        // Get the table schema by querying information_schema
        $tableSchemaQuery = "
            SELECT 
                column_name, 
                data_type, 
                character_maximum_length,
                column_default,
                is_nullable,
                udt_name
            FROM 
                information_schema.columns 
            WHERE 
                table_name = ?
            ORDER BY 
                ordinal_position";
        
        $stmtSchema = $pdo->prepare($tableSchemaQuery);
        $stmtSchema->execute([$table]);
        $columns = $stmtSchema->fetchAll(PDO::FETCH_ASSOC);
        
        // Check if the table exists in the database before querying for primary keys
        $tableExistsQuery = "
            SELECT 1 
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = ? 
            AND n.nspname = 'public'
            AND c.relkind = 'r'";
        
        $stmtTableExists = $pdo->prepare($tableExistsQuery);
        $stmtTableExists->execute([$table]);
        $tableExists = $stmtTableExists->fetchColumn();
        
        $primaryKeys = [];
        
        if ($tableExists) {
            // Get primary key information
            $primaryKeyQuery = "
                SELECT 
                    a.attname as column_name
                FROM 
                    pg_index i
                JOIN 
                    pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE 
                    i.indrelid = ?::regclass
                    AND i.indisprimary";
            
            $stmtPrimaryKey = $pdo->prepare($primaryKeyQuery);
            $stmtPrimaryKey->execute([$table]);
            
            while ($row = $stmtPrimaryKey->fetch(PDO::FETCH_ASSOC)) {
                $primaryKeys[] = $row['column_name'];
            }
        }
        
        // Start building CREATE TABLE statement
        $createTableSQL = "CREATE TABLE \"$table\" (\n";
        $columnDefinitions = [];
        
        foreach ($columns as $column) {
            $columnName = $column['column_name'];
            $dataType = $column['data_type'];
            
            // Handle special data types
            if ($dataType === 'character varying' && !is_null($column['character_maximum_length'])) {
                $dataType = "varchar({$column['character_maximum_length']})";
            } elseif ($dataType === 'character' && !is_null($column['character_maximum_length'])) {
                $dataType = "char({$column['character_maximum_length']})";
            } elseif ($column['udt_name'] === 'timestamptz') {
                $dataType = 'timestamp with time zone';
            } elseif ($column['udt_name'] === 'timestamp') {
                $dataType = 'timestamp without time zone';
            }
            
            $columnDef = "    \"$columnName\" $dataType";
            
            // Add NULL constraint
            $columnDef .= ($column['is_nullable'] === 'NO') ? ' NOT NULL' : '';
            
            // Add default value if exists
            if (!is_null($column['column_default'])) {
                $columnDef .= " DEFAULT {$column['column_default']}";
            }
            
            $columnDefinitions[] = $columnDef;
        }
        
        // Add primary key constraint if exists
        if (!empty($primaryKeys)) {
            $primaryKeyColumns = array_map(function($pk) {
                return "\"$pk\"";
            }, $primaryKeys);
            $columnDefinitions[] = "    PRIMARY KEY (" . implode(', ', $primaryKeyColumns) . ")";
        }
        
        $createTableSQL .= implode(",\n", $columnDefinitions);
        $createTableSQL .= "\n);\n\n";
        
        $backupContent .= $createTableSQL;

        // Get table data - use prepared statements for safety
        try {
            $dataQuery = "SELECT * FROM \"$table\"";
            $result = $pdo->query($dataQuery);
            $rows = $result->fetchAll(PDO::FETCH_ASSOC);

            // Only add INSERT statements if we have rows
            if (count($rows) > 0) {
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_values($row);
                    
                    // Format values properly
                    $formattedValues = array_map(function($value) {
                        if ($value === null) {
                            return 'NULL';
                        }
                        return "'" . str_replace("'", "''", $value) . "'";
                    }, $values);

                    // Quote column names for PostgreSQL
                    $quotedColumns = array_map(function($column) {
                        return "\"$column\"";
                    }, $columns);

                    $backupContent .= "INSERT INTO \"$table\" (" . implode(", ", $quotedColumns) . ") VALUES (" . 
                                    implode(", ", $formattedValues) . ");\n";
                }
            }
        } catch (PDOException $e) {
            // Log the error but continue with other tables
            $backupContent .= "-- Error getting data from table \"$table\": " . $e->getMessage() . "\n";
        }
        
        $backupContent .= "\n\n";
    }

    // Send the backup as a file to the browser
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="database_backup_' . date('Y-m-d_H-i-s') . '.sql"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo $backupContent;

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
    exit();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error: " . $e->getMessage()]);
    exit();
}
?>
