
export function calculerTotauxFacture(lignesProduits, appliquerTimbre = true) {
    let totalHT = 0;
    let totalFodec = 0;
    let totalDC = 0;
    let totalTVA = 0;
    const VALEUR_TIMBRE = 1.000; 

    lignesProduits.forEach(ligne => {
        const montantLigneHT = ligne.prix_unitaire_ht * ligne.quantite;
        const fodec = montantLigneHT * (ligne.taux_fodec / 100);
        const dc = (montantLigneHT + fodec) * (ligne.taux_dc / 100);
        
        const assietteTVA = montantLigneHT + fodec + dc;
        const tva = assietteTVA * (ligne.taux_tva / 100);

        totalHT += montantLigneHT;
        totalFodec += fodec;
        totalDC += dc;
        totalTVA += tva;
    });

    const totalTTC = totalHT + totalFodec + totalDC + totalTVA + (appliquerTimbre ? VALEUR_TIMBRE : 0);

    return {
        total_ht: totalHT.toFixed(3),
        total_fodec: totalFodec.toFixed(3),
        total_dc: totalDC.toFixed(3),
        total_tva: totalTVA.toFixed(3),
        timbre: appliquerTimbre ? "1.000" : "0.000",
        total_ttc: totalTTC.toFixed(3) 
    };
}