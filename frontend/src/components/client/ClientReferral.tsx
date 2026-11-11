import React, { useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';

// Apparition en cascade : chaque bloc monte légèrement en fondu, l'un après l'autre.
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// Pour les listes : les éléments arrivent un par un après le bloc.
const cascade: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

export const ClientReferral: React.FC = () => {
  const { currentUser } = useApp();
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();

  const referralCode = currentUser?.referralCode || 'KW-AICH01';
  const shareText = `Je te recommande KWABO pour tes projets au Bénin. Mon code de parrainage : ${referralCode}`;

  const referrals = [
    { name: 'Sylvie Mensah', at: '2024-03-01', status: 'Actif' },
    { name: 'Christian Houndété', at: '2024-03-15', status: 'Actif' },
    { name: 'Fabrice Kpadé', at: '2024-04-02', status: 'Inscrit' },
  ];

  const activeCount = referrals.filter(r => r.status === 'Actif').length;
  const rewardPerActive = 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    alert('Code copié dans le presse-papier !');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      className="stack"
      variants={container}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      {/* Welcome Banner */}
      <motion.section className="welcome welcome-center" variants={item}>
        <div>
          <h2>Votre code de parrainage</h2>
          <motion.p
            className="referral-code"
            style={{ transformOrigin: 'left center' }}
            animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {referralCode}
          </motion.p>
        </div>
        <div className="btn-row">
          <motion.button
            className="btn btn-gold"
            type="button"
            onClick={handleCopy}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <Icon name="clipboard-document" size={18} />
            <span>{copied ? 'Copié !' : 'Copier le code'}</span>
          </motion.button>
          <motion.a
            className="btn btn-outline-light inline-flex items-center gap-2 text-white"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.214 8.214 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.237 8.237 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.63c-.19.53-1.09 1.03-1.52 1.07-.39.04-.9.06-2.58-.64-2.15-.89-3.53-3.09-3.64-3.23-.11-.15-.86-1.15-.86-2.19 0-1.04.55-1.55.74-1.76.19-.22.42-.27.56-.27.14 0 .28 0 .4.01.13.01.3.06.46.43.17.39.58 1.41.63 1.52.05.11.08.24.01.39-.07.15-.11.24-.22.37-.11.13-.23.29-.33.39-.11.11-.23.23-.1.45.13.22.58.96 1.25 1.56.86.77 1.59 1.01 1.81 1.12.22.11.35.09.48-.06.13-.15.56-.65.71-.87.15-.22.3-.19.5-.11.2.08 1.28.6 1.5.71.22.11.37.17.42.27.06.1.06.6-.13 1.13Z"/>
            </svg>
            <span>Partager</span>
          </motion.a>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.ul className="stats stats-3" variants={cascade}>
        <motion.li
          className="stat stat-neutral"
          variants={item}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <span className="tile tile-sm">
            <Icon name="user-group" size={18} />
          </span>
          <strong>{referrals.length}</strong>
          <span>Filleuls</span>
        </motion.li>
        <motion.li
          className="stat stat-green"
          variants={item}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <span className="tile tile-sm">
            <Icon name="check-circle" size={18} />
          </span>
          <strong>{activeCount}</strong>
          <span>Filleuls actifs</span>
        </motion.li>
        <motion.li
          className="stat stat-gold"
          variants={item}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <span className="tile tile-sm">
            <Icon name="gift" size={18} />
          </span>
          <strong>{activeCount * rewardPerActive} €</strong>
          <span>Récompenses</span>
        </motion.li>
      </motion.ul>

   

      {/* Dash grid */}
      <motion.div className="dash-grid" variants={item}>
        <section className="card">
          <h2>Mes filleuls</h2>
          <motion.ul className="referral-list" variants={cascade}>
            {referrals.map((r, idx) => {
              const initials = r.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <motion.li key={idx} variants={item}>
                  <span className="avatar avatar-sm">{initials}</span>
                  <span>
                    <strong>{r.name}</strong>
                    <small>Depuis le {new Date(r.at).toLocaleDateString('fr-FR')}</small>
                  </span>
                  <span className={`badge ${r.status === 'Actif' ? 'badge-green' : 'badge-neutral'}`}>
                    {r.status}
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        </section>

        <section className="card">
          <h2>Comment ça marche</h2>
          <ol className="mini-steps">
            <li>Partagez votre code à un proche.</li>
            <li>Il crée son compte avec votre code.</li>
            <li>Sa première mission payée vous donne une récompense.</li>
          </ol>
        </section>
      </motion.div>
    </motion.div>
  );
};