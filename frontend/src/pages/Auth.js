import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Auth.css";

const Auth = () => {
  const [step, setStep] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitationToken, setInvitationToken] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setInvitationToken(token);
      setStep("activate");
    }
  }, [searchParams]);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setNom("");
    setPrenom("");
    setCode("");
    setNewPassword("");
    setError("");
    setInvitationToken("");
  }, []);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/login", { email, password });
      alert("Code 2FA envoyé par email");
      setStep("verify2fa");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const handleVerify2FA = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/verify-2fa", { email, code });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      const role = res.data.user.role;
      if (role === "ADMIN") navigate("/dashboard/admin");
      else if (role === "COMMERCIAL") navigate("/dashboard/commercial");
      else if (role === "COMPTABLE") navigate("/dashboard/comptable");
      else if (role === "CLIENT") navigate("/dashboard/client");
      else if (role === "FOURNISSEUR") navigate("/dashboard/fournisseur");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Code invalide");
    } finally {
      setLoading(false);
    }
  }, [email, code, navigate]);

  const handleActivate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/activate", {
        email,
        nom,
        prenom,
        invitationToken: invitationToken || undefined,
      });
      alert("Compte activé ! Vérifiez votre email.");
      setStep("login");
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur d'activation");
    } finally {
      setLoading(false);
    }
  }, [email, nom, prenom, invitationToken, resetForm]);

  const handleForgotPassword = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/forgot-password", { email });
      alert("Code de récupération envoyé par email.");
      setStep("resetPassword");
    } catch (err) {
      setError(err.response?.data?.message || "Email introuvable");
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleResetPassword = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await API.post("/auth/reset-password", { email, code, newPassword });
      alert("Mot de passe modifié avec succès !");
      setStep("login");
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de réinitialisation");
    } finally {
      setLoading(false);
    }
  }, [email, code, newPassword, resetForm]);

  const stepsConfig = {
    login: {
      title: "Connexion",
      description: "Accédez à votre tableau de bord",
      fields: [
        {
          id: "email",
          type: "email",
          placeholder: "Adresse email",
          value: email,
          setter: setEmail,
        },
        {
          id: "password",
          type: "password",
          placeholder: "Mot de passe",
          value: password,
          setter: setPassword,
        },
      ],
      onSubmit: handleLogin,
      cta: "Se connecter",
      links: [
        {
          text: "Nouveau compte ?",
          action: () => {
            resetForm();
            setStep("activate");
          },
        },
        {
          text: "Mot de passe oublié ?",
          action: () => {
            resetForm();
            setStep("forgotPassword");
          },
        },
      ],
    },
    verify2fa: {
      title: "Vérification 2FA",
      description: "Entrez le code envoyé à votre email",
      fields: [
        {
          id: "code",
          type: "text",
          placeholder: "Code de vérification",
          value: code,
          setter: setCode,
        },
      ],
      onSubmit: handleVerify2FA,
      cta: "Vérifier",
      links: [
        {
          text: "← Retour à la connexion",
          action: () => {
            resetForm();
            setStep("login");
          },
        },
      ],
    },
    activate: {
      title: "Activation du compte",
      description: "Complétez vos informations",
      fields: [
        {
          id: "nom",
          type: "text",
          placeholder: "Nom",
          value: nom,
          setter: setNom,
        },
        {
          id: "prenom",
          type: "text",
          placeholder: "Prénom",
          value: prenom,
          setter: setPrenom,
        },
        {
          id: "email",
          type: "email",
          placeholder: "Email professionnel",
          value: email,
          setter: setEmail,
        },
      ],
      onSubmit: handleActivate,
      cta: "Activer le compte",
      links: [
        {
          text: "Déjà activé ?",
          action: () => {
            resetForm();
            setStep("login");
          },
        },
      ],
    },
    forgotPassword: {
      title: "Mot de passe oublié",
      description: "Entrez votre email pour recevoir un code de récupération",
      fields: [
        {
          id: "email",
          type: "email",
          placeholder: "Adresse email",
          value: email,
          setter: setEmail,
        },
      ],
      onSubmit: handleForgotPassword,
      cta: "Envoyer le code",
      links: [
        {
          text: "← Retour à la connexion",
          action: () => {
            resetForm();
            setStep("login");
          },
        },
      ],
    },
    resetPassword: {
      title: "Réinitialisation",
      description: "Entrez le code reçu et votre nouveau mot de passe",
      fields: [
        {
          id: "code",
          type: "text",
          placeholder: "Code de récupération",
          value: code,
          setter: setCode,
        },
        {
          id: "newPassword",
          type: "password",
          placeholder: "Nouveau mot de passe",
          value: newPassword,
          setter: setNewPassword,
        },
      ],
      onSubmit: handleResetPassword,
      cta: "Réinitialiser",
      links: [
        {
          text: "← Retour à la connexion",
          action: () => {
            resetForm();
            setStep("login");
          },
        },
      ],
    },
  };

  const currentStep = stepsConfig[step];

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      currentStep.onSubmit();
    },
    [currentStep],
  );

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-panel">
          <div className="auth-header">
            <div className="brand">
              <div className="logo">B</div>
              <span className="brand-name">Business Platform</span>
            </div>
          </div>

          <div className="auth-content">
            <h1 className="title">{currentStep.title}</h1>
            <p className="description">{currentStep.description}</p>

            {error && (
              <div className="error-alert">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {currentStep.fields.map((field) => (
                <div key={field.id} className="form-field">
                  <input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    disabled={loading}
                    className="form-input"
                    required
                  />
                </div>
              ))}

              {step === "resetPassword" && (
                <p className="password-hint">
                  Min. 8 caractères, une majuscule, un chiffre et un caractère
                  spécial (@$!%*?&)
                </p>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? "Traitement..." : currentStep.cta}
              </button>
            </form>

            {currentStep.links && (
              <div className="form-footer">
                {currentStep.links.map((link) => (
                  <button
                    key={link.text}
                    type="button"
                    className="text-link"
                    onClick={link.action}
                    disabled={loading}
                  >
                    {link.text}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="auth-footer">
            <p className="support-text">
              Besoin d'aide ?{" "}
              <a href="/support" className="support-link">
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
