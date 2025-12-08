package com.richwavelet.backend;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@Order(2) // Lower priority - let static resources be handled first
public class SpaController {

    /**
     * Forward SPA routes to index.html.
     * Pattern excludes paths with dots (file extensions) and paths starting with 'api' or 'assets'.
     */
    @RequestMapping(value = {
            "/{path:^(?!api|assets|error)[^.]+$}",
            "/{path:^(?!api|assets|error)[^.]+}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
