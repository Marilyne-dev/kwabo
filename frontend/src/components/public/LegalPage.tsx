import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { PublicHeader } from '../layout/PublicHeader';
import { PublicFooter } from '../layout/PublicFooter';

export const LegalPage: React.FC<{ type?: 'confidentialite' | 'cgu' | 'mentions-legales' }> = ({ type = 'confidentialite' }) => {
  const { navigate } = useApp();

  const legalContent = {
    confidentialite: {
      title: 'Politique de confidentialité',
      body: [
        {
          title: 'Données collectées',
          text: 'Identité, e-mail, téléphone, pays de résidence, et les informations que vous donnez dans vos demandes.'
        },
        {
          title: 'Utilisation',
          text: 'Traiter vos demandes, vous envoyer vos devis et rapports, et vous informer de l\'avancement de vos missions.'
        },
        {
          title: 'Données bancaires',
          text: 'Aucune donnée de carte bancaire n\'est conservée par KWABO. Les paiements sont gérés par le prestataire de paiement.'
        },
        {
          title: 'Vos droits',
          text: 'Vous pouvez consulter, corriger et supprimer vos données. La suppression de votre compte efface toutes les données associées, depuis « Mon profil ».'
        }
      ]
    },
    cgu: {
      title: 'Conditions générales d\'utilisation',
      body: [
        {
          title: 'Objet',
          text: 'Ces conditions encadrent l\'utilisation de la plateforme KWABO.'
        },
        {
          title: 'Devis et paiement',
          text: 'Une mission démarre après acceptation et paiement du devis.'
        },
        {
          title: 'Annulation',
          text: 'Vous pouvez annuler une demande tant qu\'elle n\'a pas été acceptée.'
        }
      ]
    },
    'mentions-legales': {
      title: 'Mentions légales',
      body: [
        {
          title: 'Éditeur',
          text: 'KWABO Services, Cotonou, République du Bénin.'
        },
        {
          title: 'Hébergement',
          text: 'Plateforme sécurisée haute disponibilité.'
        }
      ]
    }
  };

  const current = legalContent[type] || legalContent.confidentialite;

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f7f4]">
      <PublicHeader />
      <main className="flex-1" id="main" tabIndex={-1}>
        <section className="page-banner" style={{ background: 'var(--green-hero)', color: '#fff', padding: '48px 0', backgroundImage: 'var(--pattern)' }}>
          <div className="container" style={{ width: 'min(1240px, 100%)', marginInline: 'auto', paddingInline: 24 }}>
            <h1 style={{ color: '#fff', fontSize: 'clamp(28px, 4vw, 44px)' }}>{current.title}</h1>
          </div>
        </section>
        
        <section className="section section-tight" style={{ padding: '36px 0 64px' }}>
          <div className="container container-narrow" style={{ width: 'min(820px, 100%)', marginInline: 'auto', paddingInline: 24 }}>
            <div className="card legal" style={{ background: '#fff', borderRadius: 'var(--r-card)', padding: 32, border: '1px solid var(--border)' }}>
              
              <div style={{ display: 'grid', gap: 24 }}>
                {current.body.map((item, idx) => (
                  <div key={idx}>
                    <h2 style={{ fontSize: 18, marginBottom: 8, color: 'var(--text)' }}>{item.title}</h2>
                    <p style={{ color: 'var(--text-mid)', lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate('client-profile')}
                >
                  <Icon name="arrow-left" size={16} />
                  <span>Retour à mon profil</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};
