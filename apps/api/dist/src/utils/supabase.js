"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = exports.signUpWithEmail = exports.signInWithEmail = exports.getAuthenticatedUser = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Helper function to get authenticated user
const getAuthenticatedUser = async () => {
    const { data: { user }, error } = await exports.supabase.auth.getUser();
    if (error) {
        throw new Error(`Authentication error: ${error.message}`);
    }
    return user;
};
exports.getAuthenticatedUser = getAuthenticatedUser;
// Helper function to sign in with email/password
const signInWithEmail = async (email, password) => {
    const { data, error } = await exports.supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) {
        throw new Error(`Sign in error: ${error.message}`);
    }
    return data;
};
exports.signInWithEmail = signInWithEmail;
// Helper function to sign up with email/password
const signUpWithEmail = async (email, password) => {
    const { data, error } = await exports.supabase.auth.signUp({
        email,
        password
    });
    if (error) {
        throw new Error(`Sign up error: ${error.message}`);
    }
    return data;
};
exports.signUpWithEmail = signUpWithEmail;
// Helper function to sign out
const signOut = async () => {
    const { error } = await exports.supabase.auth.signOut();
    if (error) {
        throw new Error(`Sign out error: ${error.message}`);
    }
};
exports.signOut = signOut;
