package com.richwavelet.backend.api;

import com.richwavelet.backend.service.SupabaseService;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/protected")
public class SupabaseExampleController {

    private final SupabaseService supabaseService;

    public SupabaseExampleController(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    /**
     * Example: Query all records from a table
     * GET /api/protected/supabase/query/{tableName}
     */
    @GetMapping("/supabase/query/{tableName}")
    public String queryTable(@PathVariable String tableName) throws IOException {
        return supabaseService.queryTable(tableName, Map.of("select", "*"));
    }

    /**
     * Example: Query with filters
     * GET /api/protected/supabase/query/{tableName}?id=123
     */
    @GetMapping("/supabase/query/{tableName}/filtered")
    public String queryTableFiltered(
            @PathVariable String tableName,
            @RequestParam Map<String, String> filters
    ) throws IOException {
        filters.put("select", "*");
        return supabaseService.queryTable(tableName, filters);
    }

    /**
     * Example: Insert data into a table
     * POST /api/protected/supabase/insert/{tableName}
     * Body: JSON object to insert
     */
    @PostMapping("/supabase/insert/{tableName}")
    public String insertIntoTable(
            @PathVariable String tableName,
            @RequestBody Map<String, Object> data
    ) throws IOException {
        return supabaseService.insertIntoTable(tableName, data);
    }

    /**
     * Example: Update data in a table
     * PATCH /api/protected/supabase/update/{tableName}?id=eq.123
     * Body: JSON object with updated fields
     */
    @PatchMapping("/supabase/update/{tableName}")
    public String updateTable(
            @PathVariable String tableName,
            @RequestParam Map<String, String> filters,
            @RequestBody Map<String, Object> data
    ) throws IOException {
        return supabaseService.updateTable(tableName, filters, data);
    }

    /**
     * Example: Delete from a table
     * DELETE /api/protected/supabase/delete/{tableName}?id=eq.123
     */
    @DeleteMapping("/supabase/delete/{tableName}")
    public void deleteFromTable(
            @PathVariable String tableName,
            @RequestParam Map<String, String> filters
    ) throws IOException {
        supabaseService.deleteFromTable(tableName, filters);
    }

    /**
     * Example: Get public URL for a file in Supabase Storage
     * GET /api/protected/supabase/storage/url/{bucket}/{path}
     */
    @GetMapping("/supabase/storage/url/{bucket}/{path}")
    public Map<String, String> getFileUrl(
            @PathVariable String bucket,
            @PathVariable String path
    ) {
        String url = supabaseService.getPublicUrl(bucket, path);
        return Map.of("url", url);
    }
}
