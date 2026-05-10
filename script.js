// =====================
// CATÉGORIES
// =====================
const categoriesParDefaut = {
    'Revenus':            ['Salaire', 'Remboursement', 'Aides et Allocations', 'Autre revenu'],
    'Logement':           ['Crédit immobilier', 'Eau / Énergie', 'Internet / Téléphone', 'Assurance', 'Taxe / Impôt', 'Entretien maison'],
    'Vie courante':       ['Alimentation', 'Santé', 'Éducation', 'Vêtements', 'Loisirs'],
    'Vacances':           ['Vacances'],
    'Transport':          ['Carburant', 'Assurance véhicule', 'Parking'],
    'Épargne & Finances': ['Épargne', 'Prêt', 'Virement'],
    'Divers':             ['Divers']
};

let categories = JSON.parse(localStorage.getItem('categories')) ||
    JSON.parse(JSON.stringify(categoriesParDefaut));

function sauvegarderCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

function buildSelectCategories(idSelect, valeurSelectionnee = '') {
    const select = document.getElementById(idSelect);
    if (!select) return;
    select.innerHTML = '<option value="">-- Catégorie --</option>';
    Object.entries(categories).forEach(([groupe, items]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupe;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            if (item === valeurSelectionnee) option.selected = true;
            optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
    });
}

// =====================
// COULEURS GRAPHIQUES
// =====================
const couleursGraphique = [
    '#8e44ad', '#2980b9', '#27ae60', '#e74c3c', '#f39c12',
    '#1abc9c', '#d35400', '#7f8c8d', '#2c3e50', '#c0392b',
    '#16a085', '#8e44ad', '#2471a3', '#1e8449', '#b7950b'
];
let chartsRecurrents = {};
let chartsDashboard = {};

// =====================
// AFFICHER LES CATÉGORIES
// =====================
function afficherCategories() {
    const conteneur = document.getElementById('liste-categories');
    if (!conteneur) return;
    conteneur.innerHTML = '';

    Object.entries(categories).forEach(([groupe, items]) => {
        let htmlItems = items.map((item, index) => `
            <div class="categorie-ligne">
                <span>${item}</span>
                <button class="btn-supprimer" onclick="supprimerCategorie('${groupe}', ${index})">🗑️</button>
            </div>
        `).join('');

        conteneur.innerHTML += `
            <div class="groupe-categorie">
                <h4 class="groupe-titre">${groupe}</h4>
                ${htmlItems}
            </div>
        `;
    });

    const selectGroupe = document.getElementById('param-groupe-existant');
    if (selectGroupe) {
        selectGroupe.innerHTML = '';
        Object.keys(categories).forEach(groupe => {
            const option = document.createElement('option');
            option.value = groupe;
            option.textContent = groupe;
            selectGroupe.appendChild(option);
        });
    }
}

// =====================
// AJOUTER UNE CATÉGORIE
// =====================
function ajouterCategorie() {
    const groupe = document.getElementById('param-groupe-existant').value;
    const nouvelle = document.getElementById('param-nouvelle-categorie').value.trim();

    if (!nouvelle) { alert('Merci de saisir un nom de catégorie.'); return; }
    if (categories[groupe].includes(nouvelle)) { alert('Cette catégorie existe déjà dans ce groupe.'); return; }

    categories[groupe].push(nouvelle);
    sauvegarderCategories();
    document.getElementById('param-nouvelle-categorie').value = '';
    afficherCategories();
    rafraichirSelecteursCategories();
}

// =====================
// CRÉER UN NOUVEAU GROUPE
// =====================
function creerGroupe() {
    const groupe = document.getElementById('param-nouveau-groupe').value.trim();
    const categorie = document.getElementById('param-categorie-nouveau-groupe').value.trim();

    if (!groupe || !categorie) { alert('Merci de saisir un nom de groupe et une première catégorie.'); return; }
    if (categories[groupe]) { alert('Ce groupe existe déjà.'); return; }

    categories[groupe] = [categorie];
    sauvegarderCategories();
    document.getElementById('param-nouveau-groupe').value = '';
    document.getElementById('param-categorie-nouveau-groupe').value = '';
    afficherCategories();
    rafraichirSelecteursCategories();
}

// =====================
// SUPPRIMER UNE CATÉGORIE
// =====================
function supprimerCategorie(groupe, index) {
    if (categories[groupe].length === 1) {
        if (!confirm(`Supprimer la dernière catégorie supprimera aussi le groupe "${groupe}". Continuer ?`)) return;
        delete categories[groupe];
    } else {
        categories[groupe].splice(index, 1);
    }
    sauvegarderCategories();
    afficherCategories();
    rafraichirSelecteursCategories();
}

// =====================
// RAFRAÎCHIR TOUS LES SÉLECTEURS
// =====================
function rafraichirSelecteursCategories() {
    ['ca', 'bnp', 'joint'].forEach(compte => {
        buildSelectCategories(`${compte}-categorie`);
        buildSelectCategories(`mois-${compte}-categorie`);
    });
    afficherCategories();
}

// =====================
// NAVIGATION
// =====================
const boutons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');

boutons.forEach(bouton => {
    bouton.addEventListener('click', () => {
        boutons.forEach(b => b.classList.remove('actif'));
        sections.forEach(s => s.classList.remove('active'));
        bouton.classList.add('actif');
        const cible = bouton.dataset.section;
        document.getElementById(cible).classList.add('active');
    });
});

// =====================
// DONNÉES RÉCURRENTS
// =====================
let recurrents = JSON.parse(localStorage.getItem('recurrents')) || { ca: [], bnp: [], joint: [] };

function sauvegarder() {
    localStorage.setItem('recurrents', JSON.stringify(recurrents));
}

// =====================
// AJOUTER UN RÉCURRENT
// =====================
function ajouterRecurrent(compte) {
    const libelle = document.getElementById(`${compte}-libelle`).value.trim();
    const montant = parseFloat(document.getElementById(`${compte}-montant`).value);
    const type = document.getElementById(`${compte}-type`).value;
    const categorie = document.getElementById(`${compte}-categorie`).value;

    if (!libelle || isNaN(montant) || montant <= 0) {
        alert('Merci de remplir le libellé et un montant valide.');
        return;
    }

    recurrents[compte].push({ libelle, montant, type, categorie });
    sauvegarder();
    document.getElementById(`${compte}-libelle`).value = '';
    document.getElementById(`${compte}-montant`).value = '';
    afficherRecurrents(compte);
}

// =====================
// AFFICHER LES RÉCURRENTS
// =====================
function afficherRecurrents(compte) {
    const tbody = document.getElementById(`liste-${compte}`);
    tbody.innerHTML = '';

    recurrents[compte].forEach((ligne, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ligne.libelle}</td>
            <td><span class="badge-categorie">${ligne.categorie || '-'}</span></td>
            <td><span class="badge-${ligne.type}">${ligne.type === 'recette' ? 'Recette' : 'Dépense'}</span></td>
            <td>${ligne.montant.toFixed(2)} €</td>
            <td>
                <button class="btn-modifier" onclick="modifierRecurrent('${compte}', ${index})">✏️</button>
                <button class="btn-supprimer" onclick="supprimerRecurrent('${compte}', ${index})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    calculerTotaux(compte);
    mettreAJourDashboard();
    mettreAJourCamembertRecurrent(compte);
}

// =====================
// SUPPRIMER UN RÉCURRENT
// =====================
function supprimerRecurrent(compte, index) {
    recurrents[compte].splice(index, 1);
    sauvegarder();
    afficherRecurrents(compte);
}

// =====================
// MODIFIER UN RÉCURRENT (inline)
// =====================
function modifierRecurrent(compte, index) {
    const ligne = recurrents[compte][index];
    const tbody = document.getElementById(`liste-${compte}`);

    const trs = tbody.querySelectorAll('tr');
    let trCible = null;
    trs.forEach(tr => {
        if (tr.querySelector(`.btn-modifier[onclick="modifierRecurrent('${compte}', ${index})"]`)) {
            trCible = tr;
        }
    });

    if (!trCible) return;

    trCible.innerHTML = `
        <td><input type="text" value="${ligne.libelle}" id="edit-rec-libelle-${compte}-${index}" style="width:150px"></td>
        <td><select id="edit-rec-categorie-${compte}-${index}"></select></td>
        <td>
            <select id="edit-rec-type-${compte}-${index}">
                <option value="recette" ${ligne.type === 'recette' ? 'selected' : ''}>Recette</option>
                <option value="depense" ${ligne.type === 'depense' ? 'selected' : ''}>Dépense</option>
            </select>
        </td>
        <td><input type="number" value="${ligne.montant}" id="edit-rec-montant-${compte}-${index}" style="width:90px"></td>
        <td>
            <button class="btn-modifier" onclick="validerModifRecurrent('${compte}', ${index})">✅</button>
            <button class="btn-supprimer" onclick="annulerModifRecurrent('${compte}')">❌</button>
        </td>
    `;

    buildSelectCategories(`edit-rec-categorie-${compte}-${index}`, ligne.categorie);
    trCible.querySelectorAll('input, select').forEach(el => {
        el.style.background = '#3a3a3a';
        el.style.color = 'white';
        el.style.border = '1px solid #6c3483';
        el.style.borderRadius = '4px';
        el.style.padding = '4px';
    });
}

function validerModifRecurrent(compte, index) {
    const libelle = document.getElementById(`edit-rec-libelle-${compte}-${index}`).value.trim();
    const categorie = document.getElementById(`edit-rec-categorie-${compte}-${index}`).value;
    const type = document.getElementById(`edit-rec-type-${compte}-${index}`).value;
    const montant = parseFloat(document.getElementById(`edit-rec-montant-${compte}-${index}`).value);

    if (!libelle || isNaN(montant) || montant <= 0) { alert('Merci de remplir le libellé et un montant valide.'); return; }

    recurrents[compte][index] = { libelle, categorie, type, montant };
    sauvegarder();
    afficherRecurrents(compte);
}

function annulerModifRecurrent(compte) {
    afficherRecurrents(compte);
}

// =====================
// CALCULER LES TOTAUX RÉCURRENTS
// =====================
function calculerTotaux(compte) {
    let recettes = 0, depenses = 0;

    recurrents[compte].forEach(ligne => {
        if (ligne.type === 'recette') recettes += ligne.montant;
        else depenses += ligne.montant;
    });

    const solde = recettes - depenses;
    document.getElementById(`${compte}-recettes`).textContent = recettes.toFixed(2) + ' €';
    document.getElementById(`${compte}-depenses`).textContent = depenses.toFixed(2) + ' €';
    const soldeEl = document.getElementById(`${compte}-solde`);
    soldeEl.textContent = solde.toFixed(2) + ' €';
    soldeEl.style.color = solde >= 0 ? '#27ae60' : '#e74c3c';
}

// =====================
// TABLEAU DE BORD GLOBAL
// =====================
function mettreAJourDashboard() {
    let totalRecettes = 0, totalDepenses = 0;

    ['ca', 'bnp', 'joint'].forEach(compte => {
        recurrents[compte].forEach(ligne => {
            if (ligne.type === 'recette') totalRecettes += ligne.montant;
            else totalDepenses += ligne.montant;
        });
    });

    const solde = totalRecettes - totalDepenses;
    document.getElementById('total-revenus').textContent = totalRecettes.toFixed(2) + ' €';
    document.getElementById('total-depenses').textContent = totalDepenses.toFixed(2) + ' €';
    const soldeEl = document.getElementById('total-solde');
    soldeEl.textContent = solde.toFixed(2) + ' €';
    soldeEl.style.color = solde >= 0 ? '#27ae60' : '#e74c3c';
}

// =====================
// CHARGEMENT INITIAL RÉCURRENTS
// =====================
afficherRecurrents('ca');
afficherRecurrents('bnp');
afficherRecurrents('joint');

['ca', 'bnp', 'joint'].forEach(compte => {
    buildSelectCategories(`${compte}-categorie`);
    buildSelectCategories(`mois-${compte}-categorie`);
});

afficherCategories();

// =====================
// DONNÉES MOIS
// =====================
let moisData = JSON.parse(localStorage.getItem('moisData')) || {};
let moisActif = null;

let triActif = {
    ca:    { colonne: 'date', ordre: 'desc' },
    bnp:   { colonne: 'date', ordre: 'desc' },
    joint: { colonne: 'date', ordre: 'desc' }
};

function sauvegarderMois() {
    localStorage.setItem('moisData', JSON.stringify(moisData));
}

// =====================
// CRÉER UN NOUVEAU MOIS
// =====================
function creerNouveauMois() {
    const moisNum = String(document.getElementById('choix-mois').value).padStart(2, '0');
    const annee = document.getElementById('choix-annee').value;
    const cle = `${annee}-${moisNum}`;

    if (moisData[cle]) { alert(`Le mois ${cle} existe déjà !`); return; }

    moisData[cle] = {
        ca: JSON.parse(JSON.stringify(recurrents.ca)),
        bnp: JSON.parse(JSON.stringify(recurrents.bnp)),
        joint: JSON.parse(JSON.stringify(recurrents.joint))
    };

    sauvegarderMois();
    mettreAJourSelecteurMois();
    document.getElementById('selecteur-mois').value = cle;
    chargerMois(cle);
    mettreAJourBilanMois();
}

// =====================
// METTRE À JOUR LE SÉLECTEUR
// =====================
function mettreAJourSelecteurMois() {
    const select = document.getElementById('selecteur-mois');
    select.innerHTML = '';

    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const cles = Object.keys(moisData).sort().reverse();

    if (cles.length === 0) {
        select.innerHTML = '<option value="">Aucun mois créé</option>';
        return;
    }

    cles.forEach(cle => {
        const [annee, moisNum] = cle.split('-');
        const nomMois = moisNoms[parseInt(moisNum) - 1];
        const option = document.createElement('option');
        option.value = cle;
        option.textContent = `${nomMois} ${annee}`;
        select.appendChild(option);
    });

    select.onchange = () => chargerMois(select.value);
}

// =====================
// CHARGER UN MOIS
// =====================
function chargerMois(cle) {
    moisActif = cle;
    ['ca', 'bnp', 'joint'].forEach(compte => afficherLignesMois(compte));
    mettreAJourBilanMois();
    mettreAJourGraphiquesDashboard();
}

// =====================
// AFFICHER LES LIGNES DU MOIS
// =====================
function afficherLignesMois(compte) {
    if (!moisActif || !moisData[moisActif]) return;

    const tbody = document.getElementById(`mois-liste-${compte}`);
    tbody.innerHTML = '';

    const toSortable = date => {
        if (!date || date === '-') return '00000000';
        if (/^\d{8}$/.test(date)) return `${date.slice(4)}${date.slice(2,4)}${date.slice(0,2)}`;
        if (date.includes('/')) {
            const [jj, mm, aaaa] = date.split('/');
            return `${aaaa}${mm}${jj}`;
        }
        return '00000000';
    };

    const formaterDate = date => {
        if (!date || date === '-') return '-';
        if (/^\d{8}$/.test(date)) return `${date.slice(0,2)}/${date.slice(2,4)}/${date.slice(4)}`;
        return date;
    };

    const recherche = (document.getElementById(`recherche-${compte}`)?.value || '').toLowerCase();

    let lignes = moisData[moisActif][compte].map((ligne, index) => ({ ...ligne, index }));

    if (recherche) {
        lignes = lignes.filter(ligne =>
            (ligne.date || '').toLowerCase().includes(recherche) ||
            (ligne.libelle || '').toLowerCase().includes(recherche) ||
            (ligne.categorie || '').toLowerCase().includes(recherche) ||
            (ligne.type || '').toLowerCase().includes(recherche) ||
            String(ligne.montant).includes(recherche)
        );
    }

    const { colonne, ordre } = triActif[compte];
    lignes.sort((a, b) => {
        let valA, valB;
        if (colonne === 'date') { valA = toSortable(a.date); valB = toSortable(b.date); }
        else if (colonne === 'montant') { valA = a.montant; valB = b.montant; }
        else { valA = (a[colonne] || '').toLowerCase(); valB = (b[colonne] || '').toLowerCase(); }
        if (valA < valB) return ordre === 'asc' ? -1 : 1;
        if (valA > valB) return ordre === 'asc' ? 1 : -1;
        return 0;
    });

    ['date', 'libelle', 'categorie', 'type', 'montant'].forEach(col => {
        const el = document.getElementById(`tri-${compte}-${col}`);
        if (el) el.textContent = col === colonne ? (ordre === 'asc' ? '▲' : '▼') : '↕';
    });

    lignes.forEach(ligne => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formaterDate(ligne.date)}</td>
            <td>${ligne.libelle}</td>
            <td><span class="badge-categorie">${ligne.categorie || '-'}</span></td>
            <td><span class="badge-${ligne.type}">${ligne.type === 'recette' ? 'Recette' : 'Dépense'}</span></td>
            <td>${ligne.montant.toFixed(2)} €</td>
            <td>
                <button class="btn-modifier" onclick="modifierLigneMois('${compte}', ${ligne.index})">✏️</button>
                <button class="btn-supprimer" onclick="supprimerLigneMois('${compte}', ${ligne.index})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    calculerTotauxMois(compte);
    mettreAJourGraphiquesDashboard();
}

// =====================
// TRIER LES LIGNES
// =====================
function trierLignes(compte, colonne) {
    if (triActif[compte].colonne === colonne) {
        triActif[compte].ordre = triActif[compte].ordre === 'asc' ? 'desc' : 'asc';
    } else {
        triActif[compte].colonne = colonne;
        triActif[compte].ordre = colonne === 'date' ? 'desc' : 'asc';
    }
    afficherLignesMois(compte);
}

// =====================
// FILTRER LES LIGNES
// =====================
function filtrerLignes(compte) {
    afficherLignesMois(compte);
}

// =====================
// AJOUTER UNE LIGNE AU MOIS
// =====================
function ajouterLigneMois(compte) {
    if (!moisActif) { alert('Crée d\'abord un mois avec le bouton "+ Nouveau mois"'); return; }

    const libelle = document.getElementById(`mois-${compte}-libelle`).value.trim();
    const date = document.getElementById(`mois-${compte}-date`).value.trim();
    const montant = parseFloat(document.getElementById(`mois-${compte}-montant`).value);
    const type = document.getElementById(`mois-${compte}-type`).value;
    const categorie = document.getElementById(`mois-${compte}-categorie`).value;

    if (!libelle || isNaN(montant) || montant <= 0) { alert('Merci de remplir le libellé et un montant valide.'); return; }

    moisData[moisActif][compte].push({ date, libelle, montant, type, categorie });
    sauvegarderMois();
    document.getElementById(`mois-${compte}-libelle`).value = '';
    document.getElementById(`mois-${compte}-date`).value = '';
    document.getElementById(`mois-${compte}-montant`).value = '';
    afficherLignesMois(compte);
}

// =====================
// SUPPRIMER UNE LIGNE DU MOIS
// =====================
function supprimerLigneMois(compte, index) {
    moisData[moisActif][compte].splice(index, 1);
    sauvegarderMois();
    afficherLignesMois(compte);
}

// =====================
// MODIFIER UNE LIGNE DU MOIS (inline)
// =====================
function modifierLigneMois(compte, index) {
    const ligne = moisData[moisActif][compte][index];
    const tbody = document.getElementById(`mois-liste-${compte}`);

    const trs = tbody.querySelectorAll('tr');
    let trCible = null;
    trs.forEach(tr => {
        if (tr.querySelector(`.btn-modifier[onclick="modifierLigneMois('${compte}', ${index})"]`)) {
            trCible = tr;
        }
    });

    if (!trCible) return;

    trCible.innerHTML = `
        <td><input type="text" value="${ligne.date || ''}" id="edit-date-${compte}-${index}" placeholder="JJ/MM/AAAA" style="width:100px"></td>
        <td><input type="text" value="${ligne.libelle}" id="edit-libelle-${compte}-${index}" style="width:150px"></td>
        <td><select id="edit-categorie-${compte}-${index}"></select></td>
        <td>
            <select id="edit-type-${compte}-${index}">
                <option value="recette" ${ligne.type === 'recette' ? 'selected' : ''}>Recette</option>
                <option value="depense" ${ligne.type === 'depense' ? 'selected' : ''}>Dépense</option>
            </select>
        </td>
        <td><input type="number" value="${ligne.montant}" id="edit-montant-${compte}-${index}" style="width:90px"></td>
        <td>
            <button class="btn-modifier" onclick="validerModifMois('${compte}', ${index})">✅</button>
            <button class="btn-supprimer" onclick="annulerModifMois('${compte}')">❌</button>
        </td>
    `;

    buildSelectCategories(`edit-categorie-${compte}-${index}`, ligne.categorie);
    trCible.querySelectorAll('input, select').forEach(el => {
        el.style.background = '#3a3a3a';
        el.style.color = 'white';
        el.style.border = '1px solid #6c3483';
        el.style.borderRadius = '4px';
        el.style.padding = '4px';
    });
}

function validerModifMois(compte, index) {
    const date = document.getElementById(`edit-date-${compte}-${index}`).value.trim();
    const libelle = document.getElementById(`edit-libelle-${compte}-${index}`).value.trim();
    const categorie = document.getElementById(`edit-categorie-${compte}-${index}`).value;
    const type = document.getElementById(`edit-type-${compte}-${index}`).value;
    const montant = parseFloat(document.getElementById(`edit-montant-${compte}-${index}`).value);

    if (!libelle || isNaN(montant) || montant <= 0) { alert('Merci de remplir le libellé et un montant valide.'); return; }

    moisData[moisActif][compte][index] = { date, libelle, categorie, type, montant };
    sauvegarderMois();
    afficherLignesMois(compte);
}

function annulerModifMois(compte) {
    afficherLignesMois(compte);
}

// =====================
// CALCULER TOTAUX DU MOIS
// =====================
function calculerTotauxMois(compte) {
    if (!moisActif || !moisData[moisActif]) return;

    let recettes = 0, depenses = 0, recettesPrev = 0, depensesPrev = 0;

    moisData[moisActif][compte].forEach(ligne => {
        if (ligne.type === 'recette') recettesPrev += ligne.montant;
        else depensesPrev += ligne.montant;

        if (ligne.date && ligne.date !== '-') {
            if (ligne.type === 'recette') recettes += ligne.montant;
            else depenses += ligne.montant;
        }
    });

    const solde = recettes - depenses;
    const soldePrev = recettesPrev - depensesPrev;

    document.getElementById(`mois-${compte}-recettes`).textContent = recettes.toFixed(2) + ' €';
    document.getElementById(`mois-${compte}-depenses`).textContent = depenses.toFixed(2) + ' €';
    const soldeEl = document.getElementById(`mois-${compte}-solde`);
    soldeEl.textContent = solde.toFixed(2) + ' €';
    soldeEl.style.color = solde >= 0 ? '#27ae60' : '#e74c3c';

    document.getElementById(`mois-${compte}-recettes-prev`).textContent = recettesPrev.toFixed(2) + ' €';
    document.getElementById(`mois-${compte}-depenses-prev`).textContent = depensesPrev.toFixed(2) + ' €';
    const soldePrevEl = document.getElementById(`mois-${compte}-solde-prev`);
    soldePrevEl.textContent = soldePrev.toFixed(2) + ' €';
    soldePrevEl.style.color = soldePrev >= 0 ? '#27ae60' : '#e74c3c';
}

// =====================
// BILAN PAR MOIS DANS LE DASHBOARD
// =====================
function mettreAJourBilanMois() {
    const conteneur = document.getElementById('bilan-mois-liste');
    conteneur.innerHTML = '';

    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    const cles = Object.keys(moisData).sort().reverse();

    if (cles.length === 0) {
        conteneur.innerHTML = '<p style="color:#aaa">Aucun mois créé pour l\'instant.</p>';
        return;
    }

    cles.forEach(cle => {
        const [annee, moisNum] = cle.split('-');
        const nomMois = moisNoms[parseInt(moisNum) - 1];
        const donnees = moisData[cle];

        let bilanComptes = {};
        let totalGlobalRecettes = 0, totalGlobalDepenses = 0;

        ['ca', 'bnp', 'joint'].forEach(compte => {
            let recettes = 0, depenses = 0;
            donnees[compte].forEach(ligne => {
                if (ligne.type === 'recette') recettes += ligne.montant;
                else depenses += ligne.montant;
            });
            bilanComptes[compte] = { recettes, depenses, solde: recettes - depenses };
            totalGlobalRecettes += recettes;
            totalGlobalDepenses += depenses;
        });

        const soldeGlobal = totalGlobalRecettes - totalGlobalDepenses;
        const couleurSolde = soldeGlobal >= 0 ? '#27ae60' : '#e74c3c';
        const noms = { ca: '🟡 Crédit Agricole', bnp: '🔵 BNP', joint: '🟢 Compte Joint' };

        let htmlComptes = ['ca', 'bnp', 'joint'].map(compte => `
            <div class="bilan-compte">
                <h4>${noms[compte]}</h4>
                <p>Recettes : <span style="color:#27ae60">${bilanComptes[compte].recettes.toFixed(2)} €</span></p>
                <p>Dépenses : <span style="color:#e74c3c">${bilanComptes[compte].depenses.toFixed(2)} €</span></p>
                <p>Solde : <span style="color:${bilanComptes[compte].solde >= 0 ? '#27ae60' : '#e74c3c'}">${bilanComptes[compte].solde.toFixed(2)} €</span></p>
            </div>
        `).join('');

        conteneur.innerHTML += `
            <div class="bilan-mois">
                <button class="btn-supprimer-mois" onclick="supprimerMois('${cle}')">🗑️ Supprimer</button>
                <h3>📅 ${nomMois} ${annee}</h3>
                <div class="bilan-mois-comptes">${htmlComptes}</div>
                <div class="bilan-global">
                    Total : Recettes <span style="color:#27ae60">${totalGlobalRecettes.toFixed(2)} €</span> —
                    Dépenses <span style="color:#e74c3c">${totalGlobalDepenses.toFixed(2)} €</span> —
                    Solde <span style="color:${couleurSolde}">${soldeGlobal.toFixed(2)} €</span>
                </div>
            </div>
        `;
    });
}

// =====================
// SUPPRIMER UN MOIS
// =====================
function supprimerMois(cle) {
    if (!confirm(`Supprimer le mois ${cle} ? Cette action est irréversible.`)) return;
    delete moisData[cle];
    sauvegarderMois();
    mettreAJourSelecteurMois();
    mettreAJourBilanMois();

    const cles = Object.keys(moisData).sort().reverse();
    if (cles.length > 0) {
        document.getElementById('selecteur-mois').value = cles[0];
        chargerMois(cles[0]);
    } else {
        moisActif = null;
    }
}

// =====================
// INITIALISATION MOIS
// =====================
mettreAJourSelecteurMois();
if (Object.keys(moisData).length > 0) {
    const dernierMois = Object.keys(moisData).sort().reverse()[0];
    document.getElementById('selecteur-mois').value = dernierMois;
    chargerMois(dernierMois);
}
mettreAJourBilanMois();


// =====================
// CAMEMBERTS RÉCURRENTS
// =====================

function mettreAJourCamembertRecurrent(compte) {
    const canvas = document.getElementById(`chart-${compte}`);
    if (!canvas) return;

    const depensesParCategorie = {};
    recurrents[compte].forEach(ligne => {
        if (ligne.type === 'depense') {
            const cat = ligne.categorie || 'Sans catégorie';
            depensesParCategorie[cat] = (depensesParCategorie[cat] || 0) + ligne.montant;
        }
    });

    const labels = Object.keys(depensesParCategorie);
    const data = Object.values(depensesParCategorie);

    if (chartsRecurrents[compte]) { chartsRecurrents[compte].destroy(); }

    if (labels.length === 0) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';

    chartsRecurrents[compte] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: couleursGraphique.slice(0, labels.length),
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#ccc', font: { size: 11 }, padding: 10 } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label} : ${ctx.parsed.toFixed(2)} €` } }
            }
        }
    });
}

// =====================
// GRAPHIQUES DASHBOARD
// =====================


function mettreAJourGraphiquesDashboard() {
    if (!moisActif || !moisData[moisActif]) return;
    ['ca', 'bnp', 'joint'].forEach(compte => {
        mettreAJourCamembertDashboard(compte);
        mettreAJourCourbeSolde(compte);
        mettreAJourBarrePrevisionnelReel(compte);
    });
}

function mettreAJourCamembertDashboard(compte) {
    const canvas = document.getElementById(`dash-chart-${compte}`);
    if (!canvas) return;

    const depensesParCategorie = {};
    moisData[moisActif][compte].forEach(ligne => {
        if (ligne.type === 'depense') {
            const cat = ligne.categorie || 'Sans catégorie';
            depensesParCategorie[cat] = (depensesParCategorie[cat] || 0) + ligne.montant;
        }
    });

    const labels = Object.keys(depensesParCategorie);
    const data = Object.values(depensesParCategorie);

    if (chartsDashboard[`pie-${compte}`]) { chartsDashboard[`pie-${compte}`].destroy(); }
    if (labels.length === 0) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';

    chartsDashboard[`pie-${compte}`] = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: couleursGraphique.slice(0, labels.length),
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#333333', font: { size: 11 }, padding: 10 } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label} : ${ctx.parsed.toFixed(2)} €` } }
            }
        }
    });
}

function mettreAJourCourbeSolde(compte) {
    const canvas = document.getElementById(`dash-courbe-${compte}`);
    if (!canvas) return;

    const toSortable = date => {
        if (!date || date === '-') return null;
        if (/^\d{8}$/.test(date)) return `${date.slice(4)}-${date.slice(2,4)}-${date.slice(0,2)}`;
        if (date.includes('/')) { const [jj, mm, aaaa] = date.split('/'); return `${aaaa}-${mm}-${jj}`; }
        return null;
    };

    const lignesAvecDate = moisData[moisActif][compte]
        .filter(l => l.date && l.date !== '-')
        .map(l => ({ ...l, dateSort: toSortable(l.date) }))
        .sort((a, b) => a.dateSort.localeCompare(b.dateSort));

    if (lignesAvecDate.length === 0) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';

    let solde = 0;
    const labels = [], data = [];

    lignesAvecDate.forEach(ligne => {
        solde += ligne.type === 'recette' ? ligne.montant : -ligne.montant;
        const dateAffiche = ligne.date.includes('/')
            ? ligne.date.slice(0, 5)
            : `${ligne.date.slice(0,2)}/${ligne.date.slice(2,4)}`;
        labels.push(dateAffiche);
        data.push(parseFloat(solde.toFixed(2)));
    });

    if (chartsDashboard[`courbe-${compte}`]) { chartsDashboard[`courbe-${compte}`].destroy(); }

    chartsDashboard[`courbe-${compte}`] = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Solde cumulé',
                data,
                borderColor: '#8e44ad',
                backgroundColor: 'rgba(142, 68, 173, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#8e44ad',
                pointRadius: 4,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)} €` } }
            },
            scales: {
                x: { ticks: { color: '#aaa', font: { size: 10 } }, grid: { color: '#333' } },
                y: { ticks: { color: '#aaa', font: { size: 10 }, callback: v => v + ' €' }, grid: { color: '#333' } }
            }
        }
    });
}

function mettreAJourBarrePrevisionnelReel(compte) {
    const canvas = document.getElementById(`dash-barre-${compte}`);
    if (!canvas) return;

    let recettesPrev = 0, depensesPrev = 0, recettesReel = 0, depensesReel = 0;

    moisData[moisActif][compte].forEach(ligne => {
        if (ligne.type === 'recette') recettesPrev += ligne.montant;
        else depensesPrev += ligne.montant;
        if (ligne.date && ligne.date !== '-') {
            if (ligne.type === 'recette') recettesReel += ligne.montant;
            else depensesReel += ligne.montant;
        }
    });

    if (chartsDashboard[`barre-${compte}`]) { chartsDashboard[`barre-${compte}`].destroy(); }

    chartsDashboard[`barre-${compte}`] = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Recettes', 'Dépenses', 'Solde'],
            datasets: [
                {
                    label: 'Prévisionnel',
                    data: [recettesPrev, depensesPrev, recettesPrev - depensesPrev],
                    backgroundColor: 'rgba(142, 68, 173, 0.7)',
                    borderColor: '#8e44ad',
                    borderWidth: 1
                },
                {
                    label: 'Réel',
                    data: [recettesReel, depensesReel, recettesReel - depensesReel],
                    backgroundColor: 'rgba(39, 174, 96, 0.7)',
                    borderColor: '#27ae60',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: '#ccc', font: { size: 11 } } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label} : ${ctx.parsed.y.toFixed(2)} €` } }
            },
            scales: {
                x: { ticks: { color: '#aaa' }, grid: { color: '#333' } },
                y: { ticks: { color: '#aaa', callback: v => v + ' €' }, grid: { color: '#333' } }
            }
        }
    });
}

// Initialisation des graphiques
mettreAJourGraphiquesDashboard();
['ca', 'bnp', 'joint'].forEach(compte => mettreAJourCamembertRecurrent(compte));
