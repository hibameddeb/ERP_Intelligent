import React, { useState, useCallback } from 'react';
import API from '../services/api';
import './Adhesion.css';

const REGIONS_TN = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès',
    'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili',
    'Le Kef', 'Mahdia', 'La Manouba', 'Médenine', 'Monastir',
    'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
    'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
];

const Adhesion = () => {
    const [formData, setFormData] = useState({
        nom: '', prenom: '', email: '', num_tlp: '',
        type_identifiant: 'MF', identifiant: '',
        adresse: '', ville: '', rue: '', activite: '', num_etablissement: '',
        num_autorisation: '', date_autorisation: '',
        region: ''  // ✅ nouveau champ
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const identifiantTypes = [
        { value: 'MF', label: 'Matricule Fiscal' },
        { value: 'CI', label: 'Carte d\'Identité Nationale' },
        { value: 'RC', label: 'Registre de Commerce' },
        { value: 'SI', label: 'Numéro SIRET' },
        { value: 'AU', label: 'Autre' }
    ];

    const handleInputChange = useCallback((field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (error) setError('');
    }, [error]);

    const handleSelectChange = useCallback((field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (error) setError('');
    }, [error]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await API.post('/demande/soumettre', formData);
            setSuccess(true);
            setFormData({
                nom: '', prenom: '', email: '', num_tlp: '',
                type_identifiant: 'MF', identifiant: '',
                adresse: '', ville: '', rue: '', activite: '', num_etablissement: '',
                num_autorisation: '', date_autorisation: '',
                region: ''  
            });
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Erreur lors de l\'envoi');
        } finally {
            setLoading(false);
        }
    }, [formData]);

    const fields = [
        { id: 'nom',             label: 'Nom *',                   type: 'text',     placeholder: 'Nom complet',               required: true  },
        { id: 'prenom',          label: 'Prénom *',                 type: 'text',     placeholder: 'Prénom',                    required: true  },
        { id: 'email',           label: 'Email professionnel *',    type: 'email',    placeholder: 'exemple@entreprise.com',    required: true  },
        { id: 'num_tlp',         label: 'Numéro de téléphone',      type: 'tel',      placeholder: '+216 98 765 432',           required: false },
        { id: 'type_identifiant',label: 'Type d\'identifiant *',    type: 'select',   options: identifiantTypes,                required: true  },
        { id: 'identifiant',     label: 'Numéro d\'identifiant *',  type: 'text',     placeholder: 'Entrez votre numéro',       required: true  },
       
        { id: 'region',          label: 'Région *',                 type: 'select',   options: REGIONS_TN.map(r => ({ value: r, label: r })), required: true },
        { id: 'ville',           label: 'Ville *',                  type: 'text',     placeholder: 'Tunis, Sfax, etc.',         required: true  },
        { id: 'num_etablissement',label: 'N° Établissement',        type: 'text',     placeholder: 'Numéro d\'établissement',   required: false },
        { id: 'activite',        label: 'Activité principale',      type: 'text',     placeholder: 'Description de l\'activité',required: false },
        { id: 'adresse',         label: 'Adresse complète *',       type: 'textarea', placeholder: 'Rue, numéro, code postal...', required: true },
        { id: 'num_autorisation',label: 'Numéro autorisation',      type: 'text',     required: false },
        { id: 'date_autorisation',label: 'Date autorisation',       type: 'date',     required: false },
    ];

    return (
        <div className="adhesion-wrapper">
            <div className="adhesion-container">
                <div className="adhesion-panel">
                    <div className="panel-header">
                        <div className="brand">
                            <div className="logo">B</div>
                            <span className="brand-name">Business Platform</span>
                        </div>
                        <div className="header-content">
                            <h1 className="page-title">Demande d'Adhésion</h1>
                            <p className="page-description">
                                Remplissez ce formulaire pour soumettre votre demande d'adhésion
                            </p>
                        </div>
                    </div>

                    <div className="form-section">
                        {success ? (
                            <div className="success-message">
                                <div className="success-icon">✓</div>
                                <h2>Demande envoyée avec succès !</h2>
                                <p>Votre demande a été transmise à notre équipe.
                                Vous recevrez une confirmation par email sous 24h.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="success-button"
                                >
                                    Nouvelle demande
                                </button>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="error-alert">
                                        <span className="error-icon">!</span>
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="adhesion-form">
                                    <div className="form-grid">
                                        {fields.map(field => (
                                            <div key={field.id} className="form-group">
                                                <label htmlFor={field.id} className="form-label">
                                                    {field.label}
                                                </label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        id={field.id}
                                                        value={formData[field.id]}
                                                        onChange={handleSelectChange(field.id)}
                                                        disabled={loading}
                                                        required={field.required}
                                                        className="form-input select"
                                                    >
                                                        <option value="">Choisir...</option>
                                                        {field.options.map(option => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : field.type === 'textarea' ? (
                                                    <textarea
                                                        id={field.id}
                                                        placeholder={field.placeholder}
                                                        value={formData[field.id]}
                                                        onChange={handleInputChange(field.id)}
                                                        disabled={loading}
                                                        rows={3}
                                                        required={field.required}
                                                        className="form-input textarea"
                                                    />
                                                ) : (
                                                    <input
                                                        id={field.id}
                                                        type={field.type}
                                                        placeholder={field.placeholder}
                                                        value={formData[field.id]}
                                                        onChange={handleInputChange(field.id)}
                                                        disabled={loading}
                                                        required={field.required}
                                                        className="form-input"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="primary-button"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner"></span>
                                                    Envoi en cours...
                                                </>
                                            ) : (
                                                'Envoyer ma demande'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>

                    <div className="panel-footer">
                        <p className="footer-text">
                            <strong>Documents requis :</strong> Copie {
                                formData.type_identifiant === 'MF' ? 'MF' :
                                formData.type_identifiant === 'CI' ? 'CI' :
                                formData.type_identifiant === 'RC' ? 'RC' :
                                formData.type_identifiant === 'SI' ? 'SI' :
                                formData.type_identifiant === 'AU' ? 'AU' :
                                'identifiant'
                            }, RIB bancaire, Registre de commerce
                        </p>
                        <p className="support-text">
                            Questions ? <a href="/support" className="support-link">Contactez-nous</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Adhesion;