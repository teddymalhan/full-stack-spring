package com.richwavelet.backend.config;

import okhttp3.OkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SupabaseConfig {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon.key}")
    private String supabaseAnonKey;

    @Value("${supabase.service.role.key}")
    private String supabaseServiceKey;

    @Bean
    public OkHttpClient supabaseHttpClient() {
        return new OkHttpClient.Builder()
                .addInterceptor(chain -> {
                    var request = chain.request().newBuilder()
                            .addHeader("apikey", supabaseAnonKey)
                            .addHeader("Authorization", "Bearer " + supabaseAnonKey)
                            .build();
                    return chain.proceed(request);
                })
                .build();
    }

    public String getSupabaseUrl() {
        return supabaseUrl;
    }

    public String getSupabaseAnonKey() {
        return supabaseAnonKey;
    }

    public String getSupabaseServiceKey() {
        return supabaseServiceKey;
    }
}
