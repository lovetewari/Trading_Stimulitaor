// UserController.java
package com.example.trading_stimulitaor.controller;

import com.example.trading_stimulitaor.model.User;
import com.example.trading_stimulitaor.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
// Removed import for PasswordEncoder
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    @Autowired
    private UserService userService;

    // Removed PasswordEncoder autowiring
    // @Autowired
    // private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username").trim();
            String password = credentials.get("password");

            if (username == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username and password required"));
            }

            User user = userService.findByUsername(username);
            if (user != null && userService.verifyPassword(password, user.getPassword())) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", user.getId());
                response.put("username", user.getUsername());
                response.put("email", user.getEmail());
                response.put("fullName", user.getFullName());
                response.put("accountBalance", user.getAccountBalance());
                response.put("createdAt", user.getCreatedAt());
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        try {
            if (user.getPassword() == null || user.getPassword().length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Password must be at least 6 characters long"));
            }

            // Check if username or email already exists
            if (userService.findByUsername(user.getUsername()) != null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Username already exists"));
            }

            if (userService.findByEmail(user.getEmail()) != null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Email already exists"));
            }

            // Remove password encoding here; it's handled in the service
            // user.setPassword(passwordEncoder.encode(user.getPassword()));

            // Set default account balance if not provided
            if (user.getAccountBalance() == null) {
                user.setAccountBalance(0.0);
            }

            User newUser = userService.createUser(user);

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", newUser.getId());
            userData.put("username", newUser.getUsername());
            userData.put("email", newUser.getEmail());
            userData.put("fullName", newUser.getFullName());
            userData.put("accountBalance", newUser.getAccountBalance());
            userData.put("createdAt", newUser.getCreatedAt());

            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        try {
            User user = userService.findByUsername(username.trim());
            if (user != null) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", user.getId());
                userData.put("username", user.getUsername());
                userData.put("email", user.getEmail());
                userData.put("fullName", user.getFullName());
                userData.put("accountBalance", user.getAccountBalance());
                return ResponseEntity.ok(userData);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{username}/profile")
    public ResponseEntity<?> updateUserProfile(
            @PathVariable String username,
            @RequestBody User updatedUser) {
        try {
            // Remove password encoding here
            // if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            //     updatedUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            // }
            User user = userService.updateUserProfile(username, updatedUser);

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            response.put("accountBalance", user.getAccountBalance());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{username}/balance")
    public ResponseEntity<?> updateBalance(
            @PathVariable String username,
            @RequestBody Map<String, Double> balanceUpdate) {
        try {
            Double newBalance = balanceUpdate.get("amount");
            if (newBalance == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Amount is required"));
            }
            User user = userService.updateAccountBalance(username, newBalance);
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "accountBalance", user.getAccountBalance()
            ));
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{username}/balance/add")
    public ResponseEntity<?> addToBalance(
            @PathVariable String username,
            @RequestBody Map<String, Double> amount) {
        try {
            Double addAmount = amount.get("amount");
            if (addAmount == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Amount is required"));
            }
            User user = userService.addToAccountBalance(username, addAmount);
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "accountBalance", user.getAccountBalance()
            ));
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{username}/balance/subtract")
    public ResponseEntity<?> subtractFromBalance(
            @PathVariable String username,
            @RequestBody Map<String, Double> amount) {
        try {
            Double subtractAmount = amount.get("amount");
            if (subtractAmount == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Amount is required"));
            }
            User user = userService.subtractFromAccountBalance(username, subtractAmount);
            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "accountBalance", user.getAccountBalance()
            ));
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        try {
            userService.deleteUser(username);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace(); // For debugging
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
