import React, { useState } from 'react';
import './Login.css';
import Logo from '../assets/Logo.jpeg';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { email?: string; password?: string } = {};

        if (!email) newErrors.email = "Please enter your email";
        if (!password) newErrors.password = "Please enter your password";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const data = { email, password };

        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/auth/login",
                data
            );

            console.log("Login response:", response.data);

            // Call AuthContext login
            login(
                {
                    id: response.data.user.id,
                    name: response.data.user.name,
                    email: response.data.user.email
                },
                response.data.token
            );

            setShowSuccessModal(true);

            setTimeout(() => {
                navigate("/chat", { state: { receiverId: 1 } });
            }, 1000);

        } catch (error: any) {
            console.error(error);

            if (error.response?.data?.message) {
                setErrors({ password: error.response.data.message });
            } else {
                setErrors({ password: "Login failed. Please try again." });
            }
        }

    };

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    return (
        <div className="login-container">
            <div className="login-content">
                <img src={Logo} alt="Logo" className="logos" />

                <form className="login-form" onSubmit={handleSubmit}>
                    <h1 className="text">Welcome Back!</h1>
                    <h1>Login</h1>

                    <label>Email:</label>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrors({ ...errors, email: "" });
                        }}
                    />
                    {errors.email && <div className="error-text">{errors.email}</div>}


                    <label>Password:</label>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setErrors({ ...errors, password: "" });
                        }}
                    />
                    {errors.password && <div className="error-text">{errors.password}</div>}


                    <button type="submit">Sign In</button>

                    <p className="register-link">
                        Don't have an account? <a href="/register">Sign up</a>
                    </p>
                </form>
            </div>
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Login Successful!</h2>
                        <button onClick={() => navigate("/chat")}>OK</button>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Login;
