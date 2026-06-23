SELECT BK_BKBE_AU_LI_DATUM,
       TENDENZ,
       TENDENZ_TAGE,
       NK_NUKR_NUMMER_KURZ,
       BK_BKBE_STATUS_BEARBEITUNG,
       BP_PP_ZUSTAND_PLANUNG,
       BP_PARTNERBELEG_STATUS,
       BK_BKBE_NUMMER,
       BP_POSITION_NUMMER,
       BK_BKBE_AU_BE_NUMMER,
       AR_NUMMER,
       BP_ARTIKEL_BEZEICHNUNG,
       BP_MESU_FE_MENGE,
       BP_MESU_VK_EP_NETTO,
       BP_MESU_VK_GP_NETTO_1,
       'BP_MENGE_GP_REST' = CASE
                                WHEN BP_MESU_FE_MENGE < 0 THEN
                                    CASE
                                        WHEN BP_MENGE_REST < 0 THEN
       (BP_MENGE_REST * BP_MESU_VK_GP_NETTO_1) / BP_MESU_FE_MENGE
                                        ELSE
                                            0
                                    END
                                ELSE
                                    CASE
                                        WHEN BP_MENGE_REST > 0 THEN
       (BP_MENGE_REST * BP_MESU_VK_GP_NETTO_1) / BP_MESU_FE_MENGE
                                        ELSE
                                            0
                                    END
                            END,
       BP_MENGE_REST,
       LG_BESTAND_LAGER_KÖRPERLICH,
       MARKIERUNG_POSITION,
       BK_BKBE_KUNDE_RE_NAME1,
       BK_BKBE_KUNDE_NUMMER,
       BK_ALLG_BELEG_BEARBEITER,
       AD_DIMENSION_FE,
       MS_AUFG_VORHANDEN,
       MS_MESSAGE_VORHANDEN,
       MS_NOTIZEN_VORHANDEN,
       D4IV_KG_BEZEICHNUNG,
       D4IV_AGBEWE_IDAGBW,
       D4IV_ARFO_TYP,
       D4IV_BELP_IDBEBP_ARFO_BASIS,
       D4IV_BP_TYP_POSITION,
       D4IV_HERKUNFT_POSITION,
       D4IV_KP_POSITION_NUMMER,
       D4IV_BK_BKBE_STATUS_BEARBEITUNG,
       ID
FROM
(
    SELECT 'BK_BKBE_AU_LI_DATUM' = CASE
                                       WHEN tBE_BELP.BP_LI_DATUM IS NOT NULL THEN
                                           tBE_BELP.BP_LI_DATUM
                                       ELSE
                                           tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                                   END,
           'TENDENZ' = DATEDIFF(   D,
                                   '23.06.2026',
                                   CASE
                                       WHEN tBE_BELP.BP_LI_DATUM IS NOT NULL THEN
                                           tBE_BELP.BP_LI_DATUM
                                       ELSE
                                           tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                                   END
                               ),
           'TENDENZ_TAGE' = DATEDIFF(   D,
                                        '23.06.2026',
                                        CASE
                                            WHEN tBE_BELP.BP_LI_DATUM IS NOT NULL THEN
                                                tBE_BELP.BP_LI_DATUM
                                            ELSE
                                                tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                                        END
                                    ),
           tNUKR.NK_NUMMER_KURZ AS NK_NUKR_NUMMER_KURZ,
           case
               when tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG = 0 then
                   case
                       when tBE_BELP_LIEF_SUMME.BP_LIEF_MENGE_SUMME is not null then
                           case
                               when tBE_BELP_MESU.BP_MESU_FE_MENGE < 0 then
                                   case
                                       when (tBE_BELP_MESU.BP_MESU_FE_MENGE
                                             + (tBE_BELP_LIEF_SUMME.BP_LIEF_MENGE_SUMME * -1)
                                            ) < 0 then
                                           0
                                       else
                                           1
                                   end
                               else
                                   case
                                       when (tBE_BELP_MESU.BP_MESU_FE_MENGE - tBE_BELP_LIEF_SUMME.BP_LIEF_MENGE_SUMME) > 0 then
                                           0
                                       else
                                           1
                                   end
                           end
                       else
                           tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
                   end
               else
                   tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
           end as BK_BKBE_STATUS_BEARBEITUNG,
           'BP_PP_ZUSTAND_PLANUNG' = CASE
                                         WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG > 0 THEN
                                             tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG - 1
                                         ELSE
                                             tBE_BELP.BP_PP_ZUSTAND_PLANUNG
                                     END,
           CASE
               WHEN ISNULL(tBE_BELP.BP_IDBEBP_PARTNERBELEG_BASIS, 0) <> 0 THEN
                   1
               ELSE
                   CASE
                       WHEN tBE_BELP.ID IN (
                                               SELECT BP_IDBEBP_PARTNERBELEG_BASIS
                                               FROM tBE_BELP
                                               WHERE ISNULL(BP_IDBEBP_PARTNERBELEG_BASIS, 0) <> 0
                                           ) THEN
                           2
                       ELSE
                           0
                   END
           END AS BP_PARTNERBELEG_STATUS,
           tBE_BELK_BKBE.BK_BKBE_NUMMER AS BK_BKBE_NUMMER,
           tBE_BELP.BP_POSITION_NUMMER AS BP_POSITION_NUMMER,
           tBE_BELK_BKBE_AU.BK_BKBE_AU_BE_NUMMER AS BK_BKBE_AU_BE_NUMMER,
           tARST.AR_NUMMER AS AR_NUMMER,
           tBE_BELP.BP_ARTIKEL_BEZEICHNUNG AS BP_ARTIKEL_BEZEICHNUNG,
           tBE_BELP_MESU.BP_MESU_VK_EP_NETTO AS BP_MESU_VK_EP_NETTO,
           CASE
               WHEN BP_POSITION_TYP = 0
                    OR BP_POSITION_TYP = 2 THEN
                   CASE
                       WHEN LG_BESTAND_LAGER_KÖRPERLICH IS NOT NULL THEN
                           LG_BESTAND_LAGER_KÖRPERLICH
                       ELSE
                           0
                   END
               ELSE
                   0
           END AS LG_BESTAND_LAGER_KÖRPERLICH,
           0 AS MARKIERUNG_POSITION,
           CASE
               WHEN tBE_BELK_BKBE.BK_BKBE_IDKU_RE_ALTERNATIV IS NOT NULL THEN
                   tADRS_RE_ALTERNATIV.AD_NAME1
               ELSE
                   tADRS_RE.AD_NAME1
           END AS BK_BKBE_KUNDE_RE_NAME1,
           tKUND.KU_NUMMER AS BK_BKBE_KUNDE_NUMMER,
           tBE_BELK_ALLG.BK_ALLG_BELEG_BEARBEITER AS BK_ALLG_BELEG_BEARBEITER,
           tARDI_FE.AD_BEZEICHNUNG AS AD_DIMENSION_FE,
           tMSAufabenVorhanden.Anzahl AS MS_AUFG_VORHANDEN,
           tMSMessageVorhanden.Anzahl AS MS_MESSAGE_VORHANDEN,
           tMSNotizenVorhanden.Anzahl AS MS_NOTIZEN_VORHANDEN,
           tBE_BELP_MESU.BP_MESU_VK_GP_NETTO_1 AS BP_MESU_VK_GP_NETTO_1,
           tBE_BELP_MESU.BP_MESU_FE_MENGE AS BP_MESU_FE_MENGE,
           CASE
               WHEN tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG <> 1 THEN
                   case
                       when tBE_BELP_LIEF_SUMME.BP_LIEF_MENGE_SUMME is not null then
                           case
                               when tBE_BELP_MESU.BP_MESU_FE_MENGE < 0 then
                                   tBE_BELP_MESU.BP_MESU_FE_MENGE + (tBE_BELP_LIEF_SUMME.BP_LIEF_MENGE_SUMME * -1)
                               else
                                   tBE_BELP_MESU.BP_MESU_FE_MENGE - tBE_BELP_LIEF_SUMME.BP_LIEF_MENGE_SUMME
                           end
                       else
                           tBE_BELP_MESU.BP_MESU_FE_MENGE
                   end
               ELSE
                   0
           END AS BP_MENGE_REST,
           tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO AS BP_MESU_GEWICHT_NETTO_MERKER,
           tBE_BELP_MESU.BP_MESU_GEWICHT_BRUTTO AS BP_MESU_GEWICHT_BRUTTO_MERKER,
           tKAGO.KG_BEZEICHNUNG AS D4IV_KG_BEZEICHNUNG,
           tAG_BEWE.ID AS D4IV_AGBEWE_IDAGBW,
           tBE_BELP.BP_ARFO_TYP AS D4IV_ARFO_TYP,
           tBE_BELP.BP_IDBEBP_ARFO_BASIS AS D4IV_BELP_IDBEBP_ARFO_BASIS,
           ISNULL(tBE_BELP.BP_POSITION_TYP, 0) AS D4IV_BP_TYP_POSITION,
           0 AS D4IV_HERKUNFT_POSITION,
           '' AS D4IV_KP_POSITION_NUMMER,
           -1 AS KP_STATUS_VERARBEITUNG,
           tBE_BELP.BP_POSITION_NUMMER_INTERN AS BP_POSITION_NUMMER_INTERN,
           case
               when tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG = 0 then
                   case
                       when tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF is not null then
                           case
                               when tBE_BELP_MESU.BP_MESU_FE_MENGE < 0 then
                                   case
                                       when (tBE_BELP_MESU.BP_MESU_FE_MENGE
                                             + (tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF * -1)
                                            ) < 0 then
                                           0
                                       else
                                           1
                                   end
                               else
                                   case
                                       when (tBE_BELP_MESU.BP_MESU_FE_MENGE
                                             - tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF
                                            ) > 0 then
                                           0
                                       else
                                           1
                                   end
                           end
                       else
                           tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
                   end
               else
                   tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
           end AS D4IV_BK_BKBE_STATUS_BEARBEITUNG,
           CASE
               WHEN ISNULL(tBE_BELP.BP_STATUS_ZEITERFASSUNG, 0) = 0
                    OR (
                           ISNULL(tBE_BELP.BP_STATUS_ZEITERFASSUNG, 0) = 2
                           AND CONVERT(DATETIME, tBE_BELP.BP_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM, 104) > '23.06.2026'
                       ) THEN
                   CASE
                       WHEN ISNULL(tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG, 0) = 1
                            OR (
                                   ISNULL(tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG, 0) = 2
                                   AND CONVERT(DATETIME, tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM, 104) <= '23.06.2026'
                               ) THEN
                           tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG
                       ELSE
                           tBE_BELP.BP_STATUS_ZEITERFASSUNG
                   END
               ELSE
                   tBE_BELP.BP_STATUS_ZEITERFASSUNG
           END AS BP_STATUS_ZEITERFASSUNG,
           CASE
               WHEN ISNULL(tBE_BELP.BP_STATUS_ZEITERFASSUNG, 0) = 0
                    OR (
                           ISNULL(tBE_BELP.BP_STATUS_ZEITERFASSUNG, 0) = 2
                           AND CONVERT(DATETIME, tBE_BELP.BP_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM, 104) > '23.06.2026'
                       ) THEN
                   CASE
                       WHEN ISNULL(tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG, 0) = 1
                            OR (
                                   ISNULL(tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG, 0) = 2
                                   AND CONVERT(DATETIME, tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM, 104) <= '23.06.2026'
                               ) THEN
                           tBE_BELK_BKBE.BK_BKBE_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM
                       ELSE
                           tBE_BELP.BP_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM
                   END
               ELSE
                   tBE_BELP.BP_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM
           END AS BP_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM,
           tBE_BELP.ID AS ID
    FROM((((((((((((((((((((((((((((((((((
    (
        SELECT tBE_BELP_BASIS.*,
               'BELP_DATUM_LI' = tBE_BELP_BASIS.BP_LI_DATUM,
               'BELP_DATUM_FE' = tBE_BELP_BASIS.BP_PP_DATUM_TERMIN,
               (
                   SELECT ID
                   FROM tBE_BELP
                   WHERE BP_IDBEBP_PARTNERBELEG_BASIS = tBE_BELP_BASIS.ID
               ) AS BP_IDBEBP_PARTNER
        FROM tBE_BELP AS tBE_BELP_BASIS
    ) AS tBE_BELP
        INNER JOIN tBE_BELP_MESU
            ON tBE_BELP_MESU.BP_MESU_IDBEBP = tBE_BELP.ID)
        INNER JOIN tBE_BELK
            ON tBE_BELK.ID = tBE_BELP.BP_IDBEBK)
        INNER JOIN
        (
            SELECT tBE_BELK_BKBE.*,
                   'BKBE_BELEG_ART' = tBE_BELK_BKBE.BK_BKBE_TYP_BELEG_ART
            FROM tBE_BELK_BKBE
        ) AS tBE_BELK_BKBE
            ON tBE_BELK_BKBE.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK)
        INNER JOIN
        (
            SELECT tBE_BELK_BKBE_AU.*,
                   'BKBE_DATUM_LI' = tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
            FROM tBE_BELK_BKBE_AU
        ) AS tBE_BELK_BKBE_AU
            ON tBE_BELK_BKBE_AU.BK_BKBE_AU_IDBKBE = tBE_BELK_BKBE.ID)
        INNER JOIN tBE_BELK_ALLG
            ON tBE_BELK_ALLG.BK_ALLG_IDBEBK = tBE_BELP.BP_IDBEBK)
        LEFT JOIN tBE_BELP_GRHD
            ON tBE_BELP_GRHD.BP_GRHD_IDBEBP = tBE_BELP.ID)
        LEFT JOIN
        (
            SELECT BP_MESU_IDBEBP AS BP_MESU_IDBEBP_BP,
                   BP_MESU_VK_GP_NETTO AS BP_MESU_VK_GP_NETTO_PB,
                   BP_MESU_VK_GP_NETTO_1 AS BP_MESU_VK_GP_NETTO_1_NETTO_PB
            FROM tBE_BELP_MESU
        ) AS tBE_BELP_MESU_PB
            ON tBE_BELP_MESU_PB.BP_MESU_IDBEBP_BP = CASE
                                                        WHEN ISNULL(tBE_BELP.BP_IDBEBP_PARTNERBELEG_BASIS, 0) = 0 THEN
                                                            tBE_BELP.BP_IDBEBP_PARTNER
                                                        ELSE
                                                            tBE_BELP.BP_IDBEBP_PARTNERBELEG_BASIS
                                                    END)
        LEFT JOIN tKUND AS tKUND_RE
            ON tKUND_RE.ID = tBE_BELK_BKBE.BK_BKBE_IDKU_RE)
        LEFT JOIN tADRS AS tADRS_RE
            ON tADRS_RE.ID = tKUND_RE.KU_IDAD)
        LEFT JOIN tKUND AS tKUND_WE
            ON tKUND_WE.ID = tBE_BELK_BKBE.BK_BKBE_IDKU_WE)
        LEFT JOIN tADRS AS tADRS_WE
            ON tADRS_WE.ID = tKUND_WE.KU_IDAD)
        LEFT JOIN tKUND AS tKUND_RE_ALTERNATIV
            ON tKUND_RE_ALTERNATIV.ID = tBE_BELK_BKBE.BK_BKBE_IDKU_RE_ALTERNATIV)
        LEFT JOIN tADRS AS tADRS_RE_ALTERNATIV
            ON tADRS_RE_ALTERNATIV.ID = tKUND_RE_ALTERNATIV.KU_IDAD)
        LEFT JOIN tKUND
            ON tKUND.ID = tBE_BELK_BKBE.BK_BKBE_IDKU_RE)
        LEFT JOIN tADRS
            ON tADRS.ID = tKUND.KU_IDAD)
        LEFT JOIN tNUKR
            ON tNUKR.ID = tBE_BELK_BKBE.BK_BKBE_IDNK)
        LEFT JOIN tARST
            ON tARST.ID = tBE_BELP.BP_IDAR)
        LEFT JOIN tARDI AS tARDI_FE
            ON tARDI_FE.ID = tBE_BELP.BP_FE_IDAD)
        LEFT JOIN tARDI AS tARDI_EK
            ON tARDI_EK.ID = tBE_BELP_MESU.BP_MESU_EK_IDAD)
        LEFT JOIN tARDI AS tARDI_VP
            ON tARDI_VP.ID = tBE_BELP_GRHD.BP_GRHD_VP_IDAD)
        LEFT JOIN tBE_BELK_BKBE AS tBE_BELK_BKBE_AUFTRAG_NUMMER
            ON tBE_BELK_BKBE_AUFTRAG_NUMMER.ID = tBE_BELK_ALLG.BK_ALLG_IDBEBKBE_AU)
        LEFT JOIN
        (
            SELECT *
            FROM tBE_BELK_SUMM
            WHERE tBE_BELK_SUMM.BK_SUMM_TYP = 2
        ) AS tBE_BELK_SUMM
            ON tBE_BELK_SUMM.BK_SUMM_IDBEBK = tBE_BELP.BP_IDBEBK)
        LEFT JOIN
        (
            SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME,
                   BP_LIEF_IDBEBP
            FROM tBE_BELP_LIEF
            WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                  AND BP_LIEF_STATUS_LIEFERUNG = 0
                  AND BP_LIEF_TYP_BEWEGUNG = 0
            GROUP BY BP_LIEF_IDBEBP
        ) AS tBE_BELP_LIEF_SUMME
            ON tBE_BELP_LIEF_SUMME.BP_LIEF_IDBEBP = tBE_BELP.ID)
        LEFT JOIN
        (
            SELECT SUM(BP_LIEF_MENGE) AS BP_BELP_LIEF_MENGE_SUMME_VORGEMERKT,
                   BP_LIEF_IDBEBP
            FROM tBE_BELP_LIEF
            WHERE BP_LIEF_TYP_BEARBEITUNG = 1
                  AND BP_LIEF_STATUS_LIEFERUNG = 0
                  AND BP_LIEF_TYP = 0
                  AND BP_LIEF_TYP_BEWEGUNG = 0
            GROUP BY BP_LIEF_IDBEBP
        ) AS tBE_BELP_LIEF_SUMME_VORGEMERKT
            ON tBE_BELP_LIEF_SUMME_VORGEMERKT.BP_LIEF_IDBEBP = tBE_BELP.ID)
        LEFT JOIN
        (
            SELECT SUM(BP_LIEF_MENGE) AS BP_BELP_LIEF_MENGE_SUMME_ERLEDIGT,
                   BP_LIEF_IDBEBP
            FROM tBE_BELP_LIEF
            WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                  AND BP_LIEF_STATUS_LIEFERUNG = 0
                  AND BP_LIEF_TYP = 0
                  AND BP_LIEF_TYP_BEWEGUNG = 0
            GROUP BY BP_LIEF_IDBEBP
        ) AS tBE_BELP_LIEF_SUMME_ERLEDIGT
            ON tBE_BELP_LIEF_SUMME_ERLEDIGT.BP_LIEF_IDBEBP = tBE_BELP.ID)
        LEFT JOIN
        (
            SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_GEPLANT_SUMME,
                   BP_LIEF_IDBEBP
            FROM tBE_BELP_LIEF
            WHERE BP_LIEF_STATUS_LIEFERUNG = 1
                  AND BP_LIEF_TYP_BEWEGUNG = 0
            GROUP BY BP_LIEF_IDBEBP
        ) AS tBE_BELP_LIEF_GEPLANT_SUMME
            ON tBE_BELP_LIEF_GEPLANT_SUMME.BP_LIEF_IDBEBP = tBE_BELP.ID)
        LEFT JOIN
        (
            SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME_LIEF,
                   BP_LIEF_IDBEBP
            FROM tBE_BELP_LIEF
            WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                  AND BP_LIEF_STATUS_LIEFERUNG = 0
                  AND BP_LIEF_TYP_BEWEGUNG = 0
            GROUP BY BP_LIEF_IDBEBP
        ) AS tBE_BELP_LIEF_SUMME_LIEF
            ON tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_IDBEBP = tBE_BELP.ID)
        LEFT JOIN tAG_BEWE
            ON tAG_BEWE.AGBW_IDBEBP = tBE_BELP.ID)
        LEFT JOIN tKAGO
            ON tKAGO.ID = tAG_BEWE.AGBW_IDKAGO)
        LEFT JOIN
        (
            SELECT tBE_BELP.ID AS IDBEBP,
                   'BP_ARFO_POSITION_BASIS' = 'Pos. ' + tBE_BELP.BP_POSITION_NUMMER + ', Artikel ' + tARST.AR_NUMMER
            FROM tBE_BELP
                LEFT JOIN tARST
                    ON tBE_BELP.BP_IDAR = tARST.ID
            WHERE tBE_BELP.BP_POSITION_TYP = 0
                  OR tBE_BELP.BP_POSITION_TYP = 2
        ) AS tBE_BELP_ARFO_BASIS
            ON tBE_BELP.BP_IDBEBP_ARFO_BASIS = tBE_BELP_ARFO_BASIS.IDBEBP)
        LEFT JOIN
        (
            SELECT LG_KENNZ_IDAR,
                   LG_BESTAND_LAGER_KÖRPERLICH,
                   LG_BESTAND_LAGER_KÖRPERLICH_UNFERTIG,
                   LG_BESTAND_LAGER_KÖRPERLICH_GESPERRT,
                   LG_BESTAND_AUFTRAG,
                   LG_BESTAND_BESTELLT,
                   LG_BESTAND_PRODUKTION_ZUGANG,
                   LG_BESTAND_PRODUKTION_ABGANG,
                   LG_BESTAND_LAGER_VERFÜGBAR,
                   LG_BESTAND_BESTELLT_OHNE_TERMIN,
                   LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN,
                   'LG_BESTAND_BESTELLVORSCHLAG' = CASE
                                                       WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                           CASE
                                                               WHEN AR_LAGER_MENGE_MELDEBESTAND <> 0 THEN
                                                                   CASE
                                                                       WHEN (AR_LAGER_MENGE_MELDEBESTAND
                                                                             - (LG_BESTAND_LAGER_VERFÜGBAR
                                                                                + LG_BESTAND_BESTELLT_OHNE_TERMIN
                                                                                + LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN
                                                                               )
                                                                            ) > 0 THEN
                                                                           AR_LAGER_MENGE_MELDEBESTAND
                                                                           - (LG_BESTAND_LAGER_VERFÜGBAR
                                                                              + LG_BESTAND_BESTELLT_OHNE_TERMIN
                                                                              + LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN
                                                                             )
                                                                       ELSE
                                                                           0
                                                                   END
                                                               ELSE
                                                                   CASE
                                                                       WHEN (LG_BESTAND_LAGER_VERFÜGBAR
                                                                             + LG_BESTAND_BESTELLT_OHNE_TERMIN
                                                                             + LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN
                                                                            ) < 0 THEN
                   (LG_BESTAND_LAGER_VERFÜGBAR + LG_BESTAND_BESTELLT_OHNE_TERMIN
                    + LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN
                   ) * -1
                                                                       ELSE
                                                                           0
                                                                   END
                                                           END
                                                       ELSE
                                                           0
                                                   END
            FROM
            (
                SELECT *,
                       'LG_BESTAND_LAGER_VERFÜGBAR' = ROUND(
                                                               LG_BESTAND_LAGER_KÖRPERLICH
                                                               + (LG_BESTAND_BESTELLT - LG_BESTAND_AUFTRAG)
                                                               + (LG_BESTAND_PRODUKTION_ZUGANG
                                                                  - LG_BESTAND_PRODUKTION_ABGANG
                                                                 ),
                                                               4
                                                           )
                FROM
                (
                    SELECT LG_KENNZ_IDAR,
                           'LG_BESTAND_LAGER_KÖRPERLICH' = CASE
                                                               WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                   ROUND(ISNULL(LG_BESTAND_LAGER_KÖRPERLICH, 0), 4)
                                                               ELSE
                                                                   0
                                                           END,
                           'LG_BESTAND_LAGER_KÖRPERLICH_UNFERTIG' = CASE
                                                                        WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                            ROUND(
                                                                                     ISNULL(
                                                                                               LG_BESTAND_LAGER_KÖRPERLICH_UNFERTIG,
                                                                                               0
                                                                                           ),
                                                                                     4
                                                                                 )
                                                                        ELSE
                                                                            0
                                                                    END,
                           'LG_BESTAND_LAGER_KÖRPERLICH_GESPERRT' = CASE
                                                                        WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                            ROUND(
                                                                                     ISNULL(
                                                                                               LG_BESTAND_LAGER_KÖRPERLICH_GESPERRT,
                                                                                               0
                                                                                           ),
                                                                                     4
                                                                                 )
                                                                        ELSE
                                                                            0
                                                                    END,
                           'LG_BESTAND_AUFTRAG' = CASE
                                                      WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                          ROUND(ISNULL(LG_BESTAND_AUFTRAG, 0), 4)
                                                      ELSE
                                                          0
                                                  END,
                           'LG_BESTAND_BESTELLT' = CASE
                                                       WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                           ROUND(ISNULL(LG_BESTAND_BESTELLT, 0), 4)
                                                       ELSE
                                                           0
                                                   END,
                           'LG_BESTAND_BESTELLT_OHNE_TERMIN' = CASE
                                                                   WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                       ROUND(
                                                                                ISNULL(
                                                                                          LG_BESTAND_BESTELLT_OHNE_TERMIN,
                                                                                          0
                                                                                      ),
                                                                                4
                                                                            )
                                                                   ELSE
                                                                       0
                                                               END,
                           'LG_BESTAND_PRODUKTION_ZUGANG' = CASE
                                                                WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                    ROUND(ISNULL(LG_BESTAND_PRODUKTION_ZUGANG, 0), 4)
                                                                ELSE
                                                                    0
                                                            END,
                           'LG_BESTAND_PRODUKTION_ABGANG' = CASE
                                                                WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                    ROUND(ISNULL(LG_BESTAND_PRODUKTION_ABGANG, 0), 4)
                                                                ELSE
                                                                    0
                                                            END,
                           'LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN' = CASE
                                                                            WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                                ROUND(
                                                                                         ISNULL(
                                                                                                   LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN,
                                                                                                   0
                                                                                               ),
                                                                                         4
                                                                                     )
                                                                            ELSE
                                                                                0
                                                                        END,
                           AR_LAGER_MENGE_MELDEBESTAND,
                           AR_TYP_LAGER_BUCHUNG
                    FROM(((((
                    (
                        SELECT ID AS LG_KENNZ_IDAR,
                               AR_TYP_LAGER_BUCHUNG,
                               AR_LAGER_MENGE_MELDEBESTAND
                        FROM tARST
                        WHERE AR_TYP_LAGER_BUCHUNG = 1
                    ) AS tARST_LG_KENNZ
                        LEFT JOIN
                        (
                            SELECT LBW_IDAR,
                                   ISNULL(SUM(LBW_MENGE_FE), 0) AS LG_BESTAND_LAGER_KÖRPERLICH
                            FROM tLG_BEWE
                                LEFT JOIN tLG_ORTE
                                    ON tLG_ORTE.ID = tLG_BEWE.LBW_IDLGOR
                            WHERE LO_STATUS = 0
                            GROUP BY LBW_IDAR
                        ) AS tLG_BEST_BESTAND_KÖRPERLICH
                            ON tLG_BEST_BESTAND_KÖRPERLICH.LBW_IDAR = tARST_LG_KENNZ.LG_KENNZ_IDAR)
                        LEFT JOIN
                        (
                            SELECT LBW_IDAR,
                                   ISNULL(SUM(LBW_MENGE_FE), 0) AS LG_BESTAND_LAGER_KÖRPERLICH_UNFERTIG
                            FROM tLG_BEWE
                                LEFT JOIN tLG_ORTE
                                    ON tLG_ORTE.ID = tLG_BEWE.LBW_IDLGOR
                            WHERE LO_STATUS = 1
                            GROUP BY LBW_IDAR
                        ) AS tLG_BEST_BESTAND_KÖRPERLICH_UNFERTIG
                            ON tLG_BEST_BESTAND_KÖRPERLICH_UNFERTIG.LBW_IDAR = tARST_LG_KENNZ.LG_KENNZ_IDAR)
                        LEFT JOIN
                        (
                            SELECT LBW_IDAR,
                                   ISNULL(SUM(LBW_MENGE_FE), 0) AS LG_BESTAND_LAGER_KÖRPERLICH_GESPERRT
                            FROM tLG_BEWE
                                LEFT JOIN tLG_ORTE
                                    ON tLG_ORTE.ID = tLG_BEWE.LBW_IDLGOR
                            WHERE LO_STATUS = 2
                            GROUP BY LBW_IDAR
                        ) AS tLG_BEST_BESTAND_KÖRPERLICH_GESPERRT
                            ON tLG_BEST_BESTAND_KÖRPERLICH_GESPERRT.LBW_IDAR = tARST_LG_KENNZ.LG_KENNZ_IDAR)
                        LEFT JOIN
                        (
                            SELECT tARST.ID AS LG_AU_IDAR_AR,
                                   'LG_BESTAND_AUFTRAG' = ROUND(
                                                                   ISNULL(LG_BESTAND_BELP, 0)
                                                                   + ISNULL(LG_BESTAND_SKKALK, 0),
                                                                   4
                                                               ),
                                   'LG_BESTAND_PRODUKTION_ZUGANG' = ROUND(
                                                                             ISNULL(
                                                                                       LG_BESTAND_BELP_PRODUKTION_ZUGANG,
                                                                                       0
                                                                                   ),
                                                                             4
                                                                         ),
                                   'LG_BESTAND_PRODUKTION_ABGANG' = ROUND(
                                                                             ISNULL(
                                                                                       LG_BESTAND_SKKALK_PRODUKTION_ABGANG,
                                                                                       0
                                                                                   ),
                                                                             4
                                                                         ),
                                   'LG_BESTAND_PRODUKTION_ZUGANG_OHNE_TERMIN' = ROUND(
                                                                                         ISNULL(
                                                                                                   LG_BESTAND_BELP_PRODUKTION_ZUGANG_OHNE_TERMIN,
                                                                                                   0
                                                                                               ),
                                                                                         4
                                                                                     )
                            FROM((
                            (SELECT ID FROM tARST WHERE AR_TYP_LAGER_BUCHUNG = 1) AS tARST
                                LEFT JOIN
                                (
                                    SELECT LG_AU_IDAR,
                                           SUM(LG_AU_MENGE) AS LG_BESTAND_BELP,
                                           SUM(LG_AU_MENGE_PRODUKTION_ZUGANG) AS LG_BESTAND_BELP_PRODUKTION_ZUGANG,
                                           SUM(LG_AU_MENGE_PRODUKTION_ZUGANG_OHNE_TERMIN) AS LG_BESTAND_BELP_PRODUKTION_ZUGANG_OHNE_TERMIN
                                    FROM
                                    (
                                        SELECT 'LG_AU_IDAR' = BP_IDAR,
                                               'LG_AU_MENGE' = CASE
                                                                   WHEN BK_BKBE_TYP_BELEG_ART = 0 THEN
                                                                       CASE
                                                                           WHEN ISNULL(BP_MESU_FE_MENGE, 0)
                                                                                - ISNULL(BP_LIEF_MENGE_SUMME, 0) < 0 THEN
                                                                               0
                                                                           ELSE
                                                                               ISNULL(BP_MESU_FE_MENGE, 0)
                                                                               - ISNULL(BP_LIEF_MENGE_SUMME, 0)
                                                                       END
                                                                   ELSE
                                                                       0
                                                               END,
                                               'LG_AU_MENGE_PRODUKTION_ZUGANG' = CASE
                                                                                     WHEN BK_BKBE_TYP_BELEG_ART = 1 THEN
                                                                                         CASE
                                                                                             WHEN CASE
                                                                                                      WHEN BP_PP_DATUM_TERMIN IS NULL
                                                                                                           AND BP_LI_DATUM IS NULL
                                                                                                           AND BK_BKBE_AU_LI_DATUM IS NULL THEN
                                                                                                          0
                                                                                                      ELSE
                                                                                                          1
                                                                                                  END = 1 THEN
                                                                                                 CASE
                                                                                                     WHEN ISNULL(
                                                                                                                    BP_MESU_FE_MENGE,
                                                                                                                    0
                                                                                                                )
                                                                                                          - ISNULL(
                                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                                      0
                                                                                                                  ) < 0 THEN
                                                                                                         0
                                                                                                     ELSE
                                                                                                         ISNULL(
                                                                                                                   BP_MESU_FE_MENGE,
                                                                                                                   0
                                                                                                               )
                                                                                                         - ISNULL(
                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                     0
                                                                                                                 )
                                                                                                 END
                                                                                             ELSE
                                                                                                 0
                                                                                         END
                                                                                     ELSE
                                                                                         0
                                                                                 END,
                                               'LG_AU_MENGE_PRODUKTION_ZUGANG_OHNE_TERMIN' = CASE
                                                                                                 WHEN BK_BKBE_TYP_BELEG_ART = 1 THEN
                                                                                                     CASE
                                                                                                         WHEN CASE
                                                                                                                  WHEN BP_PP_DATUM_TERMIN IS NULL
                                                                                                                       AND BP_LI_DATUM IS NULL
                                                                                                                       AND BK_BKBE_AU_LI_DATUM IS NULL THEN
                                                                                                                      0
                                                                                                                  ELSE
                                                                                                                      1
                                                                                                              END = 0 THEN
                                                                                                             CASE
                                                                                                                 WHEN ISNULL(
                                                                                                                                BP_MESU_FE_MENGE,
                                                                                                                                0
                                                                                                                            )
                                                                                                                      - ISNULL(
                                                                                                                                  BP_LIEF_MENGE_SUMME,
                                                                                                                                  0
                                                                                                                              ) < 0 THEN
                                                                                                                     0
                                                                                                                 ELSE
                                                                                                                     ISNULL(
                                                                                                                               BP_MESU_FE_MENGE,
                                                                                                                               0
                                                                                                                           )
                                                                                                                     - ISNULL(
                                                                                                                                 BP_LIEF_MENGE_SUMME,
                                                                                                                                 0
                                                                                                                             )
                                                                                                             END
                                                                                                         ELSE
                                                                                                             0
                                                                                                     END
                                                                                                 ELSE
                                                                                                     0
                                                                                             END
                                        FROM((((
                                        (
                                            SELECT ID,
                                                   BP_IDAR,
                                                   BP_IDBEBK,
                                                   BP_LAGER_STATUS_BUCHUNG,
                                                   BP_LI_DATUM,
                                                   BP_PP_DATUM_TERMIN
                                            FROM tBE_BELP
                                            WHERE BP_POSITION_TYP = 0
                                        ) AS tBE_BELP
                                            INNER JOIN
                                            (
                                                SELECT BP_MESU_FE_MENGE,
                                                       BP_MESU_GEWICHT_NETTO,
                                                       BP_MESU_IDBEBP
                                                FROM tBE_BELP_MESU
                                                    INNER JOIN
                                                    (
                                                        SELECT ID,
                                                               BP_IDLGOR
                                                        FROM tBE_BELP
                                                            INNER JOIN
                                                            (
                                                                SELECT BK_BKBE_IDBEBK
                                                                FROM tBE_BELK_BKBE
                                                                WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                      AND BK_BKBE_TYP_BELEG = 2
                                                            ) AS tBE_BELK_BKBE_OFFEN
                                                                ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                        WHERE BP_POSITION_TYP = 0
                                                    ) AS tBE_BELP
                                                        ON tBE_BELP.ID = tBE_BELP_MESU.BP_MESU_IDBEBP
                                                    LEFT JOIN tLG_ORTE
                                                        ON tLG_ORTE.ID = tBE_BELP.BP_IDLGOR
                                                WHERE (ISNULL(tBE_BELP.BP_IDLGOR, 0) = 0)
                                                      OR (
                                                             ISNULL(tBE_BELP.BP_IDLGOR, 0) > 0
                                                             AND ISNULL(tLG_ORTE.LO_STATUS, 0) = 0
                                                         )
                                            ) AS tBE_BELP_MESU
                                                ON tBE_BELP_MESU.BP_MESU_IDBEBP = tBE_BELP.ID)
                                            LEFT JOIN
                                            (
                                                SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME,
                                                       BP_LIEF_IDBEBP
                                                FROM
                                                (
                                                    SELECT tBE_BELP_LIEF.*
                                                    FROM tBE_BELP_LIEF
                                                        LEFT JOIN
                                                        (
                                                            SELECT ID,
                                                                   BP_IDBEBK
                                                            FROM tBE_BELP
                                                            WHERE BP_POSITION_TYP = 0
                                                        ) AS tBE_BELP
                                                            ON tBE_BELP.ID = tBE_BELP_LIEF.BP_LIEF_IDBEBP
                                                        INNER JOIN
                                                        (
                                                            SELECT BK_BKBE_IDBEBK
                                                            FROM tBE_BELK_BKBE
                                                            WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                  AND BK_BKBE_TYP_BELEG = 2
                                                        ) AS tBE_BELK_BKBE_OFFEN
                                                            ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                ) AS tBE_BELP_LIEF
                                                WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                                                      AND BP_LIEF_STATUS_LIEFERUNG = 0
                                                      AND BP_LIEF_TYP_BEWEGUNG = 0
                                                GROUP BY BP_LIEF_IDBEBP
                                            ) AS tBE_BELP_LIEF
                                                ON tBE_BELP_LIEF.BP_LIEF_IDBEBP = tBE_BELP.ID)
                                            LEFT JOIN
                                            (
                                                SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME_MANUELL,
                                                       BP_LIEF_IDBEBP
                                                FROM
                                                (
                                                    SELECT tBE_BELP_LIEF.*
                                                    FROM tBE_BELP_LIEF
                                                        LEFT JOIN
                                                        (
                                                            SELECT ID,
                                                                   BP_IDBEBK
                                                            FROM tBE_BELP
                                                            WHERE BP_POSITION_TYP = 0
                                                        ) AS tBE_BELP
                                                            ON tBE_BELP.ID = tBE_BELP_LIEF.BP_LIEF_IDBEBP
                                                        INNER JOIN
                                                        (
                                                            SELECT BK_BKBE_IDBEBK
                                                            FROM tBE_BELK_BKBE
                                                            WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                  AND BK_BKBE_TYP_BELEG = 2
                                                        ) AS tBE_BELK_BKBE_OFFEN
                                                            ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                ) AS tBE_BELP_LIEF
                                                WHERE BP_LIEF_TYP = 0
                                                      AND BP_LIEF_TYP_BEARBEITUNG = 0
                                                      AND BP_LIEF_STATUS_LIEFERUNG = 0
                                                      AND BP_LIEF_TYP_BEWEGUNG = 0
                                                GROUP BY BP_LIEF_IDBEBP
                                            ) AS tBE_BELP_LIEF_MANUELL
                                                ON tBE_BELP_LIEF_MANUELL.BP_LIEF_IDBEBP = tBE_BELP.ID)
                                            LEFT JOIN
                                            (
                                                SELECT BK_BKBE_TYP_BELEG,
                                                       BK_BKBE_TYP_BELEG_ART,
                                                       'BKBE_BELEG_ART' = BK_BKBE_TYP_BELEG_ART,
                                                       BK_BKBE_STATUS_BEARBEITUNG,
                                                       BK_BKBE_IDBEBK,
                                                       BK_BKBE_DATUM_BELEG,
                                                       ID
                                                FROM tBE_BELK_BKBE
                                            ) AS tBE_BELK_BKBE
                                                ON tBE_BELK_BKBE.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK)
                                            LEFT JOIN
                                            (
                                                SELECT ID,
                                                       BK_BKBE_AU_IDBKBE,
                                                       BK_BKBE_AU_LI_DATUM
                                                FROM tBE_BELK_BKBE_AU
                                            ) AS tBE_BELK_BKBE_AU
                                                ON tBE_BELK_BKBE_AU.BK_BKBE_AU_IDBKBE = tBE_BELK_BKBE.ID
                                        WHERE BK_BKBE_TYP_BELEG = 2
                                              AND BK_BKBE_STATUS_BEARBEITUNG = 0
                                              AND BP_LAGER_STATUS_BUCHUNG = 0
                                              AND (
                                            (
                                                BK_BKBE_TYP_BELEG_ART = 0
                                                AND tBE_BELP.ID NOT IN (
                                                                           SELECT KK_IDBEBP
                                                                           FROM tSK_KALK
                                                                           WHERE tSK_KALK.KK_IDBEBP = tBE_BELP.ID
                                                                                 AND KK_TYP_LAGER_BUCHUNG = 1
                                                                                 AND ISNULL(
                                                                                     (
                                                                                         SELECT COUNT(KP_IDSKKK)
                                                                                         FROM tSK_KALP
                                                                                         WHERE tSK_KALP.KP_IDSKKK = tSK_KALK.ID
                                                                                     ),
                                                                                     0
                                                                                           ) > 0
                                                                       )
                                            )
                                                  )
                                        UNION ALL
                                        SELECT 'LG_AU_IDAR' = BP_IDAR,
                                               'LG_AU_MENGE' = CASE
                                                                   WHEN BK_BKBE_TYP_BELEG_ART = 0 THEN
                                                                       CASE
                                                                           WHEN ISNULL(BP_MESU_FE_MENGE, 0)
                                                                                - ISNULL(BP_LIEF_MENGE_SUMME, 0) < 0 THEN
                                                                               0
                                                                           ELSE
                                                                               ISNULL(BP_MESU_FE_MENGE, 0)
                                                                               - ISNULL(BP_LIEF_MENGE_SUMME, 0)
                                                                       END
                                                                   ELSE
                                                                       0
                                                               END,
                                               'LG_AU_MENGE_PRODUKTION_ZUGANG' = CASE
                                                                                     WHEN BK_BKBE_TYP_BELEG_ART = 1 THEN
                                                                                         CASE
                                                                                             WHEN CASE
                                                                                                      WHEN BP_PP_DATUM_TERMIN IS NULL
                                                                                                           AND BP_LI_DATUM IS NULL
                                                                                                           AND BK_BKBE_AU_LI_DATUM IS NULL THEN
                                                                                                          0
                                                                                                      ELSE
                                                                                                          1
                                                                                                  END = 1 THEN
                                                                                                 CASE
                                                                                                     WHEN ISNULL(
                                                                                                                    BP_MESU_FE_MENGE,
                                                                                                                    0
                                                                                                                )
                                                                                                          - ISNULL(
                                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                                      0
                                                                                                                  ) < 0 THEN
                                                                                                         0
                                                                                                     ELSE
                                                                                                         ISNULL(
                                                                                                                   BP_MESU_FE_MENGE,
                                                                                                                   0
                                                                                                               )
                                                                                                         - ISNULL(
                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                     0
                                                                                                                 )
                                                                                                 END
                                                                                             ELSE
                                                                                                 0
                                                                                         END
                                                                                     ELSE
                                                                                         0
                                                                                 END,
                                               'LG_AU_MENGE_PRODUKTION_ZUGANG_OHNE_TERMIN' = CASE
                                                                                                 WHEN BK_BKBE_TYP_BELEG_ART = 1 THEN
                                                                                                     CASE
                                                                                                         WHEN CASE
                                                                                                                  WHEN BP_PP_DATUM_TERMIN IS NULL
                                                                                                                       AND BP_LI_DATUM IS NULL
                                                                                                                       AND BK_BKBE_AU_LI_DATUM IS NULL THEN
                                                                                                                      0
                                                                                                                  ELSE
                                                                                                                      1
                                                                                                              END = 0 THEN
                                                                                                             CASE
                                                                                                                 WHEN ISNULL(
                                                                                                                                BP_MESU_FE_MENGE,
                                                                                                                                0
                                                                                                                            )
                                                                                                                      - ISNULL(
                                                                                                                                  BP_LIEF_MENGE_SUMME,
                                                                                                                                  0
                                                                                                                              ) < 0 THEN
                                                                                                                     0
                                                                                                                 ELSE
                                                                                                                     ISNULL(
                                                                                                                               BP_MESU_FE_MENGE,
                                                                                                                               0
                                                                                                                           )
                                                                                                                     - ISNULL(
                                                                                                                                 BP_LIEF_MENGE_SUMME,
                                                                                                                                 0
                                                                                                                             )
                                                                                                             END
                                                                                                         ELSE
                                                                                                             0
                                                                                                     END
                                                                                                 ELSE
                                                                                                     0
                                                                                             END
                                        FROM((((
                                        (
                                            SELECT ID,
                                                   BP_IDAR,
                                                   BP_IDBEBK,
                                                   BP_LAGER_STATUS_BUCHUNG,
                                                   BP_LI_DATUM,
                                                   BP_PP_DATUM_TERMIN
                                            FROM tBE_BELP
                                            WHERE BP_POSITION_TYP = 0
                                        ) AS tBE_BELP
                                            INNER JOIN
                                            (
                                                SELECT BP_MESU_FE_MENGE,
                                                       BP_MESU_GEWICHT_NETTO,
                                                       BP_MESU_IDBEBP
                                                FROM tBE_BELP_MESU
                                                    INNER JOIN
                                                    (
                                                        SELECT ID,
                                                               BP_IDLGOR
                                                        FROM tBE_BELP
                                                            INNER JOIN
                                                            (
                                                                SELECT BK_BKBE_IDBEBK
                                                                FROM tBE_BELK_BKBE
                                                                WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                      AND BK_BKBE_TYP_BELEG = 2
                                                            ) AS tBE_BELK_BKBE_OFFEN
                                                                ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                        WHERE BP_POSITION_TYP = 0
                                                    ) AS tBE_BELP
                                                        ON tBE_BELP.ID = tBE_BELP_MESU.BP_MESU_IDBEBP
                                                    LEFT JOIN tLG_ORTE
                                                        ON tLG_ORTE.ID = tBE_BELP.BP_IDLGOR
                                                WHERE (ISNULL(tBE_BELP.BP_IDLGOR, 0) = 0)
                                                      OR (
                                                             ISNULL(tBE_BELP.BP_IDLGOR, 0) > 0
                                                             AND ISNULL(tLG_ORTE.LO_STATUS, 0) = 0
                                                         )
                                            ) AS tBE_BELP_MESU
                                                ON tBE_BELP_MESU.BP_MESU_IDBEBP = tBE_BELP.ID)
                                            LEFT JOIN
                                            (
                                                SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME,
                                                       BP_LIEF_IDBEBP
                                                FROM
                                                (
                                                    SELECT tBE_BELP_LIEF.*
                                                    FROM tBE_BELP_LIEF
                                                        LEFT JOIN
                                                        (
                                                            SELECT ID,
                                                                   BP_IDBEBK
                                                            FROM tBE_BELP
                                                            WHERE BP_POSITION_TYP = 0
                                                        ) AS tBE_BELP
                                                            ON tBE_BELP.ID = tBE_BELP_LIEF.BP_LIEF_IDBEBP
                                                        INNER JOIN
                                                        (
                                                            SELECT BK_BKBE_IDBEBK
                                                            FROM tBE_BELK_BKBE
                                                            WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                  AND BK_BKBE_TYP_BELEG = 2
                                                        ) AS tBE_BELK_BKBE_OFFEN
                                                            ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                ) AS tBE_BELP_LIEF
                                                WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                                                      AND BP_LIEF_STATUS_LIEFERUNG = 0
                                                      AND BP_LIEF_TYP_BEWEGUNG = 0
                                                GROUP BY BP_LIEF_IDBEBP
                                            ) AS tBE_BELP_LIEF
                                                ON tBE_BELP_LIEF.BP_LIEF_IDBEBP = tBE_BELP.ID)
                                            LEFT JOIN
                                            (
                                                SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME_MANUELL,
                                                       BP_LIEF_IDBEBP
                                                FROM
                                                (
                                                    SELECT tBE_BELP_LIEF.*
                                                    FROM tBE_BELP_LIEF
                                                        LEFT JOIN
                                                        (
                                                            SELECT ID,
                                                                   BP_IDBEBK
                                                            FROM tBE_BELP
                                                            WHERE BP_POSITION_TYP = 0
                                                        ) AS tBE_BELP
                                                            ON tBE_BELP.ID = tBE_BELP_LIEF.BP_LIEF_IDBEBP
                                                        INNER JOIN
                                                        (
                                                            SELECT BK_BKBE_IDBEBK
                                                            FROM tBE_BELK_BKBE
                                                            WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                  AND BK_BKBE_TYP_BELEG = 2
                                                        ) AS tBE_BELK_BKBE_OFFEN
                                                            ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                ) AS tBE_BELP_LIEF
                                                WHERE BP_LIEF_TYP = 0
                                                      AND BP_LIEF_TYP_BEARBEITUNG = 0
                                                      AND BP_LIEF_STATUS_LIEFERUNG = 0
                                                      AND BP_LIEF_TYP_BEWEGUNG = 0
                                                GROUP BY BP_LIEF_IDBEBP
                                            ) AS tBE_BELP_LIEF_MANUELL
                                                ON tBE_BELP_LIEF_MANUELL.BP_LIEF_IDBEBP = tBE_BELP.ID)
                                            LEFT JOIN
                                            (
                                                SELECT BK_BKBE_TYP_BELEG,
                                                       BK_BKBE_TYP_BELEG_ART,
                                                       'BKBE_BELEG_ART' = BK_BKBE_TYP_BELEG_ART,
                                                       BK_BKBE_STATUS_BEARBEITUNG,
                                                       BK_BKBE_IDBEBK,
                                                       BK_BKBE_DATUM_BELEG,
                                                       ID
                                                FROM tBE_BELK_BKBE
                                            ) AS tBE_BELK_BKBE
                                                ON tBE_BELK_BKBE.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK)
                                            LEFT JOIN
                                            (
                                                SELECT ID,
                                                       BK_BKBE_AU_IDBKBE,
                                                       BK_BKBE_AU_LI_DATUM
                                                FROM tBE_BELK_BKBE_AU
                                            ) AS tBE_BELK_BKBE_AU
                                                ON tBE_BELK_BKBE_AU.BK_BKBE_AU_IDBKBE = tBE_BELK_BKBE.ID
                                        WHERE BK_BKBE_TYP_BELEG = 2
                                              AND BK_BKBE_STATUS_BEARBEITUNG = 0
                                              AND BP_LAGER_STATUS_BUCHUNG = 0
                                              AND (BK_BKBE_TYP_BELEG_ART = 1)
                                    ) AS tBE_BELP_BESTAND_AUFTRAG_1
                                    GROUP BY LG_AU_IDAR
                                ) AS tBE_BELP_BESTAND_AUFTRAG
                                    ON tBE_BELP_BESTAND_AUFTRAG.LG_AU_IDAR = tARST.ID)
                                LEFT JOIN
                                (
                                    SELECT KP_IDAR AS LG_AU_IDAR_SK,
                                           SUM(KP_MENGE_KUM) AS LG_BESTAND_SKKALK,
                                           SUM(KP_MENGE_KUM_PRODUKTION_ABGANG) AS LG_BESTAND_SKKALK_PRODUKTION_ABGANG
                                    FROM
                                    (
                                        SELECT KP_IDAR,
                                               KP_MENGE_KUM,
                                               KP_MENGE_KUM_PRODUKTION_ABGANG
                                        FROM
                                        (
                                            SELECT KP_IDSKKK,
                                                   'KP_MENGE_KUM' = SUM(KP_MENGE_KUM),
                                                   'KP_MENGE_KUM_PRODUKTION_ABGANG' = SUM(KP_MENGE_KUM_PRODUKTION_ABGANG),
                                                   KP_IDAR
                                            FROM
                                            (
                                                SELECT KP_IDSKKK,
                                                       'KP_MENGE_KUM' = CASE
                                                                            WHEN BK_BKBE_TYP_BELEG_ART = 0 THEN
                                                                                ROUND(
                                                                                         ISNULL(
                                                                                                   CASE
                                                                                                       WHEN ISNULL(
                                                                                                                      KK_IDBEBP_BASIS,
                                                                                                                      0
                                                                                                                  ) <> 0 THEN
                                                                                                           CASE
                                                                                                               WHEN (KP_MENGE
                                                                                                                     * KK_MENGE_GES
                                                                                                                     * case
                                                                                                                           when KP_TYP_MENGE_BASIS = 0 then
                                                                                                                               case
                                                                                                                                   when KP_HK_MENGE_BASIS = 0 then
                                                                                                                                       case
                                                                                                                                           when isnull(
                                                                                                                                                          BP_MESU_FE_MENGE,
                                                                                                                                                          0
                                                                                                                                                      )
                                                                                                                                                - CASE
                                                                                                                                                      WHEN ISNULL(
                                                                                                                                                                     SUMME_LGBEWE_SKKALP,
                                                                                                                                                                     0
                                                                                                                                                                 ) = 0 THEN
                                                                                                                                                          isnull(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                      ELSE
                                                                                                                                                          ISNULL(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                  END < 0 then
                                                                                                                                               0
                                                                                                                                           else
                                                                                                                                               isnull(
                                                                                                                                                         BP_MESU_FE_MENGE,
                                                                                                                                                         0
                                                                                                                                                     )
                                                                                                                                               - CASE
                                                                                                                                                     WHEN ISNULL(
                                                                                                                                                                    SUMME_LGBEWE_SKKALP,
                                                                                                                                                                    0
                                                                                                                                                                ) = 0 THEN
                                                                                                                                                         isnull(
                                                                                                                                                                   BP_LIEF_MENGE_SUMME,
                                                                                                                                                                   0
                                                                                                                                                               )
                                                                                                                                                     ELSE
                                                                                                                                                         ISNULL(
                                                                                                                                                                   BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                   0
                                                                                                                                                               )
                                                                                                                                                 END
                                                                                                                                       end
                                                                                                                                   else
                                                                                                                                       case
                                                                                                                                           when isnull(
                                                                                                                                                          BP_MESU_FE_MENGE,
                                                                                                                                                          0
                                                                                                                                                      )
                                                                                                                                                - CASE
                                                                                                                                                      WHEN ISNULL(
                                                                                                                                                                     SUMME_LGBEWE_SKKALP,
                                                                                                                                                                     0
                                                                                                                                                                 ) = 0 THEN
                                                                                                                                                          isnull(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                      ELSE
                                                                                                                                                          ISNULL(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                  END < 0 then
                                                                                                                                               0
                                                                                                                                           else
                                                                                                                                               round(
                                                                                                                                                        (isnull(
                                                                                                                                                                   BP_MESU_FE_MENGE,
                                                                                                                                                                   0
                                                                                                                                                               )
                                                                                                                                                         - CASE
                                                                                                                                                               WHEN ISNULL(
                                                                                                                                                                              SUMME_LGBEWE_SKKALP,
                                                                                                                                                                              0
                                                                                                                                                                          ) = 0 THEN
                                                                                                                                                                   isnull(
                                                                                                                                                                             BP_LIEF_MENGE_SUMME,
                                                                                                                                                                             0
                                                                                                                                                                         )
                                                                                                                                                               ELSE
                                                                                                                                                                   ISNULL(
                                                                                                                                                                             BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                             0
                                                                                                                                                                         )
                                                                                                                                                           END
                                                                                                                                                        )
                                                                                                                                                        * isnull(
                                                                                                                                                                    BP_MESU_GEWICHT_NETTO,
                                                                                                                                                                    0
                                                                                                                                                                ),
                                                                                                                                                        4
                                                                                                                                                    )
                                                                                                                                       end
                                                                                                                               end
                                                                                                                           else
                                                                                                                               case
                                                                                                                                   when isnull(
                                                                                                                                                  BP_MESU_FE_MENGE,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                        - CASE
                                                                                                                                              WHEN ISNULL(
                                                                                                                                                             SUMME_LGBEWE_SKKALP,
                                                                                                                                                             0
                                                                                                                                                         ) = 0 THEN
                                                                                                                                                  isnull(
                                                                                                                                                            BP_LIEF_MENGE_SUMME,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                              ELSE
                                                                                                                                                  ISNULL(
                                                                                                                                                            BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                          END <= 0 then
                                                                                                                                       0
                                                                                                                                   else
                                                                                                                                       1
                                                                                                                               end
                                                                                                                       end
                                                                                                                    )
                                                                                                                    - ISNULL(
                                                                                                                                SUMME_LGBEWE_SKKALP,
                                                                                                                                0
                                                                                                                            ) <= 0 THEN
                                                                                                                   0
                                                                                                               ELSE
                                                                                                   (KP_MENGE
                                                                                                    * KK_MENGE_GES
                                                                                                    * case
                                                                                                          when KP_TYP_MENGE_BASIS = 0 then
                                                                                                              case
                                                                                                                  when KP_HK_MENGE_BASIS = 0 then
                                                                                                                      case
                                                                                                                          when isnull(
                                                                                                                                         BP_MESU_FE_MENGE,
                                                                                                                                         0
                                                                                                                                     )
                                                                                                                               - CASE
                                                                                                                                     WHEN ISNULL(
                                                                                                                                                    SUMME_LGBEWE_SKKALP,
                                                                                                                                                    0
                                                                                                                                                ) = 0 THEN
                                                                                                                                         isnull(
                                                                                                                                                   BP_LIEF_MENGE_SUMME,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                     ELSE
                                                                                                                                         ISNULL(
                                                                                                                                                   BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                 END < 0 then
                                                                                                                              0
                                                                                                                          else
                                                                                                                              isnull(
                                                                                                                                        BP_MESU_FE_MENGE,
                                                                                                                                        0
                                                                                                                                    )
                                                                                                                              - CASE
                                                                                                                                    WHEN ISNULL(
                                                                                                                                                   SUMME_LGBEWE_SKKALP,
                                                                                                                                                   0
                                                                                                                                               ) = 0 THEN
                                                                                                                                        isnull(
                                                                                                                                                  BP_LIEF_MENGE_SUMME,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                    ELSE
                                                                                                                                        ISNULL(
                                                                                                                                                  BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                END
                                                                                                                      end
                                                                                                                  else
                                                                                                                      case
                                                                                                                          when isnull(
                                                                                                                                         BP_MESU_FE_MENGE,
                                                                                                                                         0
                                                                                                                                     )
                                                                                                                               - CASE
                                                                                                                                     WHEN ISNULL(
                                                                                                                                                    SUMME_LGBEWE_SKKALP,
                                                                                                                                                    0
                                                                                                                                                ) = 0 THEN
                                                                                                                                         isnull(
                                                                                                                                                   BP_LIEF_MENGE_SUMME,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                     ELSE
                                                                                                                                         ISNULL(
                                                                                                                                                   BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                 END < 0 then
                                                                                                                              0
                                                                                                                          else
                                                                                                                              round(
                                                                                                                                       (isnull(
                                                                                                                                                  BP_MESU_FE_MENGE,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                        - CASE
                                                                                                                                              WHEN ISNULL(
                                                                                                                                                             SUMME_LGBEWE_SKKALP,
                                                                                                                                                             0
                                                                                                                                                         ) = 0 THEN
                                                                                                                                                  isnull(
                                                                                                                                                            BP_LIEF_MENGE_SUMME,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                              ELSE
                                                                                                                                                  ISNULL(
                                                                                                                                                            BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                          END
                                                                                                                                       )
                                                                                                                                       * isnull(
                                                                                                                                                   BP_MESU_GEWICHT_NETTO,
                                                                                                                                                   0
                                                                                                                                               ),
                                                                                                                                       4
                                                                                                                                   )
                                                                                                                      end
                                                                                                              end
                                                                                                          else
                                                                                                              case
                                                                                                                  when isnull(
                                                                                                                                 BP_MESU_FE_MENGE,
                                                                                                                                 0
                                                                                                                             )
                                                                                                                       - CASE
                                                                                                                             WHEN ISNULL(
                                                                                                                                            SUMME_LGBEWE_SKKALP,
                                                                                                                                            0
                                                                                                                                        ) = 0 THEN
                                                                                                                                 isnull(
                                                                                                                                           BP_LIEF_MENGE_SUMME,
                                                                                                                                           0
                                                                                                                                       )
                                                                                                                             ELSE
                                                                                                                                 ISNULL(
                                                                                                                                           BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                           0
                                                                                                                                       )
                                                                                                                         END <= 0 then
                                                                                                                      0
                                                                                                                  else
                                                                                                                      1
                                                                                                              end
                                                                                                      end
                                                                                                   )
                                                                                                   - ISNULL(
                                                                                                               SUMME_LGBEWE_SKKALP,
                                                                                                               0
                                                                                                           )
                                                                                                           END
                                                                                                       ELSE
                                                                                                           CASE
                                                                                                               WHEN (KP_MENGE
                                                                                                                     * case
                                                                                                                           when KP_TYP_MENGE_BASIS = 0 then
                                                                                                                               case
                                                                                                                                   when KP_HK_MENGE_BASIS = 0 then
                                                                                                                                       case
                                                                                                                                           when isnull(
                                                                                                                                                          BP_MESU_FE_MENGE,
                                                                                                                                                          0
                                                                                                                                                      )
                                                                                                                                                - CASE
                                                                                                                                                      WHEN ISNULL(
                                                                                                                                                                     SUMME_LGBEWE_SKKALP,
                                                                                                                                                                     0
                                                                                                                                                                 ) = 0 THEN
                                                                                                                                                          isnull(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                      ELSE
                                                                                                                                                          ISNULL(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                  END < 0 then
                                                                                                                                               0
                                                                                                                                           else
                                                                                                                                               isnull(
                                                                                                                                                         BP_MESU_FE_MENGE,
                                                                                                                                                         0
                                                                                                                                                     )
                                                                                                                                               - CASE
                                                                                                                                                     WHEN ISNULL(
                                                                                                                                                                    SUMME_LGBEWE_SKKALP,
                                                                                                                                                                    0
                                                                                                                                                                ) = 0 THEN
                                                                                                                                                         isnull(
                                                                                                                                                                   BP_LIEF_MENGE_SUMME,
                                                                                                                                                                   0
                                                                                                                                                               )
                                                                                                                                                     ELSE
                                                                                                                                                         ISNULL(
                                                                                                                                                                   BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                   0
                                                                                                                                                               )
                                                                                                                                                 END
                                                                                                                                       end
                                                                                                                                   else
                                                                                                                                       case
                                                                                                                                           when isnull(
                                                                                                                                                          BP_MESU_FE_MENGE,
                                                                                                                                                          0
                                                                                                                                                      )
                                                                                                                                                - CASE
                                                                                                                                                      WHEN ISNULL(
                                                                                                                                                                     SUMME_LGBEWE_SKKALP,
                                                                                                                                                                     0
                                                                                                                                                                 ) = 0 THEN
                                                                                                                                                          isnull(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                      ELSE
                                                                                                                                                          ISNULL(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                  END < 0 then
                                                                                                                                               0
                                                                                                                                           else
                                                                                                                                               round(
                                                                                                                                                        (isnull(
                                                                                                                                                                   BP_MESU_FE_MENGE,
                                                                                                                                                                   0
                                                                                                                                                               )
                                                                                                                                                         - CASE
                                                                                                                                                               WHEN ISNULL(
                                                                                                                                                                              SUMME_LGBEWE_SKKALP,
                                                                                                                                                                              0
                                                                                                                                                                          ) = 0 THEN
                                                                                                                                                                   isnull(
                                                                                                                                                                             BP_LIEF_MENGE_SUMME,
                                                                                                                                                                             0
                                                                                                                                                                         )
                                                                                                                                                               ELSE
                                                                                                                                                                   ISNULL(
                                                                                                                                                                             BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                             0
                                                                                                                                                                         )
                                                                                                                                                           END
                                                                                                                                                        )
                                                                                                                                                        * isnull(
                                                                                                                                                                    BP_MESU_GEWICHT_NETTO,
                                                                                                                                                                    0
                                                                                                                                                                ),
                                                                                                                                                        4
                                                                                                                                                    )
                                                                                                                                       end
                                                                                                                               end
                                                                                                                           else
                                                                                                                               case
                                                                                                                                   when isnull(
                                                                                                                                                  BP_MESU_FE_MENGE,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                        - CASE
                                                                                                                                              WHEN ISNULL(
                                                                                                                                                             SUMME_LGBEWE_SKKALP,
                                                                                                                                                             0
                                                                                                                                                         ) = 0 THEN
                                                                                                                                                  isnull(
                                                                                                                                                            BP_LIEF_MENGE_SUMME,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                              ELSE
                                                                                                                                                  ISNULL(
                                                                                                                                                            BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                          END <= 0 then
                                                                                                                                       0
                                                                                                                                   else
                                                                                                                                       1
                                                                                                                               end
                                                                                                                       end
                                                                                                                    )
                                                                                                                    - ISNULL(
                                                                                                                                SUMME_LGBEWE_SKKALP,
                                                                                                                                0
                                                                                                                            ) <= 0 THEN
                                                                                                                   0
                                                                                                               ELSE
                                                                                                   (KP_MENGE
                                                                                                    * case
                                                                                                          when KP_TYP_MENGE_BASIS = 0 then
                                                                                                              case
                                                                                                                  when KP_HK_MENGE_BASIS = 0 then
                                                                                                                      case
                                                                                                                          when isnull(
                                                                                                                                         BP_MESU_FE_MENGE,
                                                                                                                                         0
                                                                                                                                     )
                                                                                                                               - CASE
                                                                                                                                     WHEN ISNULL(
                                                                                                                                                    SUMME_LGBEWE_SKKALP,
                                                                                                                                                    0
                                                                                                                                                ) = 0 THEN
                                                                                                                                         isnull(
                                                                                                                                                   BP_LIEF_MENGE_SUMME,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                     ELSE
                                                                                                                                         ISNULL(
                                                                                                                                                   BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                 END < 0 then
                                                                                                                              0
                                                                                                                          else
                                                                                                                              isnull(
                                                                                                                                        BP_MESU_FE_MENGE,
                                                                                                                                        0
                                                                                                                                    )
                                                                                                                              - CASE
                                                                                                                                    WHEN ISNULL(
                                                                                                                                                   SUMME_LGBEWE_SKKALP,
                                                                                                                                                   0
                                                                                                                                               ) = 0 THEN
                                                                                                                                        isnull(
                                                                                                                                                  BP_LIEF_MENGE_SUMME,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                    ELSE
                                                                                                                                        ISNULL(
                                                                                                                                                  BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                END
                                                                                                                      end
                                                                                                                  else
                                                                                                                      case
                                                                                                                          when isnull(
                                                                                                                                         BP_MESU_FE_MENGE,
                                                                                                                                         0
                                                                                                                                     )
                                                                                                                               - CASE
                                                                                                                                     WHEN ISNULL(
                                                                                                                                                    SUMME_LGBEWE_SKKALP,
                                                                                                                                                    0
                                                                                                                                                ) = 0 THEN
                                                                                                                                         isnull(
                                                                                                                                                   BP_LIEF_MENGE_SUMME,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                     ELSE
                                                                                                                                         ISNULL(
                                                                                                                                                   BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                 END < 0 then
                                                                                                                              0
                                                                                                                          else
                                                                                                                              round(
                                                                                                                                       (isnull(
                                                                                                                                                  BP_MESU_FE_MENGE,
                                                                                                                                                  0
                                                                                                                                              )
                                                                                                                                        - CASE
                                                                                                                                              WHEN ISNULL(
                                                                                                                                                             SUMME_LGBEWE_SKKALP,
                                                                                                                                                             0
                                                                                                                                                         ) = 0 THEN
                                                                                                                                                  isnull(
                                                                                                                                                            BP_LIEF_MENGE_SUMME,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                              ELSE
                                                                                                                                                  ISNULL(
                                                                                                                                                            BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                            0
                                                                                                                                                        )
                                                                                                                                          END
                                                                                                                                       )
                                                                                                                                       * isnull(
                                                                                                                                                   BP_MESU_GEWICHT_NETTO,
                                                                                                                                                   0
                                                                                                                                               ),
                                                                                                                                       4
                                                                                                                                   )
                                                                                                                      end
                                                                                                              end
                                                                                                          else
                                                                                                              case
                                                                                                                  when isnull(
                                                                                                                                 BP_MESU_FE_MENGE,
                                                                                                                                 0
                                                                                                                             )
                                                                                                                       - CASE
                                                                                                                             WHEN ISNULL(
                                                                                                                                            SUMME_LGBEWE_SKKALP,
                                                                                                                                            0
                                                                                                                                        ) = 0 THEN
                                                                                                                                 isnull(
                                                                                                                                           BP_LIEF_MENGE_SUMME,
                                                                                                                                           0
                                                                                                                                       )
                                                                                                                             ELSE
                                                                                                                                 ISNULL(
                                                                                                                                           BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                           0
                                                                                                                                       )
                                                                                                                         END <= 0 then
                                                                                                                      0
                                                                                                                  else
                                                                                                                      1
                                                                                                              end
                                                                                                      end
                                                                                                   )
                                                                                                   - ISNULL(
                                                                                                               SUMME_LGBEWE_SKKALP,
                                                                                                               0
                                                                                                           )
                                                                                                           END
                                                                                                   END,
                                                                                                   0
                                                                                               ),
                                                                                         4
                                                                                     )
                                                                            ELSE
                                                                                0
                                                                        END,
                                                       'KP_MENGE_KUM_PRODUKTION_ABGANG' = CASE
                                                                                              WHEN BK_BKBE_TYP_BELEG_ART = 1
                                                                                                   AND CASE
                                                                                                           WHEN tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG = 0 THEN
                                                                                                               CASE
                                                                                                                   WHEN tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF IS NOT NULL THEN
                                                                                                                       CASE
                                                                                                                           WHEN tBE_BELP_MESU.BP_MESU_FE_MENGE < 0 THEN
                                                                                                                               CASE
                                                                                                                                   WHEN (tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                                         + (tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF
                                                                                                                                            * -1
                                                                                                                                           )
                                                                                                                                        ) < 0 THEN
                                                                                                                                       0
                                                                                                                                   ELSE
                                                                                                                                       1
                                                                                                                               END
                                                                                                                           ELSE
                                                                                                                               CASE
                                                                                                                                   WHEN (tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                                         - tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF
                                                                                                                                        ) > 0 THEN
                                                                                                                                       0
                                                                                                                                   ELSE
                                                                                                                                       1
                                                                                                                               END
                                                                                                                       END
                                                                                                                   ELSE
                                                                                                                       tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
                                                                                                               END
                                                                                                           ELSE
                                                                                                               tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
                                                                                                       END = 0 THEN
                                                                                                  ROUND(
                                                                                                           ISNULL(
                                                                                                                     CASE
                                                                                                                         WHEN ISNULL(
                                                                                                                                        KK_IDBEBP_BASIS,
                                                                                                                                        0
                                                                                                                                    ) <> 0 THEN
                                                                                                                             CASE
                                                                                                                                 WHEN (KP_MENGE
                                                                                                                                       * KK_MENGE_GES
                                                                                                                                       * case
                                                                                                                                             when KP_TYP_MENGE_BASIS = 0 then
                                                                                                                                                 case
                                                                                                                                                     when KP_HK_MENGE_BASIS = 0 then
                                                                                                                                                         case
                                                                                                                                                             when isnull(
                                                                                                                                                                            BP_MESU_FE_MENGE,
                                                                                                                                                                            0
                                                                                                                                                                        )
                                                                                                                                                                  - CASE
                                                                                                                                                                        WHEN ISNULL(
                                                                                                                                                                                       SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                       0
                                                                                                                                                                                   ) = 0 THEN
                                                                                                                                                                            isnull(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                        ELSE
                                                                                                                                                                            ISNULL(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                    END < 0 then
                                                                                                                                                                 0
                                                                                                                                                             else
                                                                                                                                                                 isnull(
                                                                                                                                                                           BP_MESU_FE_MENGE,
                                                                                                                                                                           0
                                                                                                                                                                       )
                                                                                                                                                                 - CASE
                                                                                                                                                                       WHEN ISNULL(
                                                                                                                                                                                      SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                      0
                                                                                                                                                                                  ) = 0 THEN
                                                                                                                                                                           isnull(
                                                                                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                     0
                                                                                                                                                                                 )
                                                                                                                                                                       ELSE
                                                                                                                                                                           ISNULL(
                                                                                                                                                                                     BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                     0
                                                                                                                                                                                 )
                                                                                                                                                                   END
                                                                                                                                                         end
                                                                                                                                                     else
                                                                                                                                                         case
                                                                                                                                                             when isnull(
                                                                                                                                                                            BP_MESU_FE_MENGE,
                                                                                                                                                                            0
                                                                                                                                                                        )
                                                                                                                                                                  - CASE
                                                                                                                                                                        WHEN ISNULL(
                                                                                                                                                                                       SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                       0
                                                                                                                                                                                   ) = 0 THEN
                                                                                                                                                                            isnull(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                        ELSE
                                                                                                                                                                            ISNULL(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                    END < 0 then
                                                                                                                                                                 0
                                                                                                                                                             else
                                                                                                                                                                 round(
                                                                                                                                                                          (isnull(
                                                                                                                                                                                     BP_MESU_FE_MENGE,
                                                                                                                                                                                     0
                                                                                                                                                                                 )
                                                                                                                                                                           - CASE
                                                                                                                                                                                 WHEN ISNULL(
                                                                                                                                                                                                SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                                0
                                                                                                                                                                                            ) = 0 THEN
                                                                                                                                                                                     isnull(
                                                                                                                                                                                               BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                               0
                                                                                                                                                                                           )
                                                                                                                                                                                 ELSE
                                                                                                                                                                                     ISNULL(
                                                                                                                                                                                               BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                               0
                                                                                                                                                                                           )
                                                                                                                                                                             END
                                                                                                                                                                          )
                                                                                                                                                                          * isnull(
                                                                                                                                                                                      BP_MESU_GEWICHT_NETTO,
                                                                                                                                                                                      0
                                                                                                                                                                                  ),
                                                                                                                                                                          4
                                                                                                                                                                      )
                                                                                                                                                         end
                                                                                                                                                 end
                                                                                                                                             else
                                                                                                                                                 case
                                                                                                                                                     when isnull(
                                                                                                                                                                    BP_MESU_FE_MENGE,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                          - CASE
                                                                                                                                                                WHEN ISNULL(
                                                                                                                                                                               SUMME_LGBEWE_SKKALP,
                                                                                                                                                                               0
                                                                                                                                                                           ) = 0 THEN
                                                                                                                                                                    isnull(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                                ELSE
                                                                                                                                                                    ISNULL(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                            END <= 0 then
                                                                                                                                                         0
                                                                                                                                                     else
                                                                                                                                                         1
                                                                                                                                                 end
                                                                                                                                         end
                                                                                                                                      )
                                                                                                                                      - ISNULL(
                                                                                                                                                  SUMME_LGBEWE_SKKALP,
                                                                                                                                                  0
                                                                                                                                              ) <= 0 THEN
                                                                                                                                     0
                                                                                                                                 ELSE
                                                                                                                     (KP_MENGE
                                                                                                                      * KK_MENGE_GES
                                                                                                                      * case
                                                                                                                            when KP_TYP_MENGE_BASIS = 0 then
                                                                                                                                case
                                                                                                                                    when KP_HK_MENGE_BASIS = 0 then
                                                                                                                                        case
                                                                                                                                            when isnull(
                                                                                                                                                           BP_MESU_FE_MENGE,
                                                                                                                                                           0
                                                                                                                                                       )
                                                                                                                                                 - CASE
                                                                                                                                                       WHEN ISNULL(
                                                                                                                                                                      SUMME_LGBEWE_SKKALP,
                                                                                                                                                                      0
                                                                                                                                                                  ) = 0 THEN
                                                                                                                                                           isnull(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                       ELSE
                                                                                                                                                           ISNULL(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                   END < 0 then
                                                                                                                                                0
                                                                                                                                            else
                                                                                                                                                isnull(
                                                                                                                                                          BP_MESU_FE_MENGE,
                                                                                                                                                          0
                                                                                                                                                      )
                                                                                                                                                - CASE
                                                                                                                                                      WHEN ISNULL(
                                                                                                                                                                     SUMME_LGBEWE_SKKALP,
                                                                                                                                                                     0
                                                                                                                                                                 ) = 0 THEN
                                                                                                                                                          isnull(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                      ELSE
                                                                                                                                                          ISNULL(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                  END
                                                                                                                                        end
                                                                                                                                    else
                                                                                                                                        case
                                                                                                                                            when isnull(
                                                                                                                                                           BP_MESU_FE_MENGE,
                                                                                                                                                           0
                                                                                                                                                       )
                                                                                                                                                 - CASE
                                                                                                                                                       WHEN ISNULL(
                                                                                                                                                                      SUMME_LGBEWE_SKKALP,
                                                                                                                                                                      0
                                                                                                                                                                  ) = 0 THEN
                                                                                                                                                           isnull(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                       ELSE
                                                                                                                                                           ISNULL(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                   END < 0 then
                                                                                                                                                0
                                                                                                                                            else
                                                                                                                                                round(
                                                                                                                                                         (isnull(
                                                                                                                                                                    BP_MESU_FE_MENGE,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                          - CASE
                                                                                                                                                                WHEN ISNULL(
                                                                                                                                                                               SUMME_LGBEWE_SKKALP,
                                                                                                                                                                               0
                                                                                                                                                                           ) = 0 THEN
                                                                                                                                                                    isnull(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                                ELSE
                                                                                                                                                                    ISNULL(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                            END
                                                                                                                                                         )
                                                                                                                                                         * isnull(
                                                                                                                                                                     BP_MESU_GEWICHT_NETTO,
                                                                                                                                                                     0
                                                                                                                                                                 ),
                                                                                                                                                         4
                                                                                                                                                     )
                                                                                                                                        end
                                                                                                                                end
                                                                                                                            else
                                                                                                                                case
                                                                                                                                    when isnull(
                                                                                                                                                   BP_MESU_FE_MENGE,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                         - CASE
                                                                                                                                               WHEN ISNULL(
                                                                                                                                                              SUMME_LGBEWE_SKKALP,
                                                                                                                                                              0
                                                                                                                                                          ) = 0 THEN
                                                                                                                                                   isnull(
                                                                                                                                                             BP_LIEF_MENGE_SUMME,
                                                                                                                                                             0
                                                                                                                                                         )
                                                                                                                                               ELSE
                                                                                                                                                   ISNULL(
                                                                                                                                                             BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                             0
                                                                                                                                                         )
                                                                                                                                           END <= 0 then
                                                                                                                                        0
                                                                                                                                    else
                                                                                                                                        1
                                                                                                                                end
                                                                                                                        end
                                                                                                                     )
                                                                                                                     - ISNULL(
                                                                                                                                 SUMME_LGBEWE_SKKALP,
                                                                                                                                 0
                                                                                                                             )
                                                                                                                             END
                                                                                                                         ELSE
                                                                                                                             CASE
                                                                                                                                 WHEN (KP_MENGE
                                                                                                                                       * case
                                                                                                                                             when KP_TYP_MENGE_BASIS = 0 then
                                                                                                                                                 case
                                                                                                                                                     when KP_HK_MENGE_BASIS = 0 then
                                                                                                                                                         case
                                                                                                                                                             when isnull(
                                                                                                                                                                            BP_MESU_FE_MENGE,
                                                                                                                                                                            0
                                                                                                                                                                        )
                                                                                                                                                                  - CASE
                                                                                                                                                                        WHEN ISNULL(
                                                                                                                                                                                       SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                       0
                                                                                                                                                                                   ) = 0 THEN
                                                                                                                                                                            isnull(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                        ELSE
                                                                                                                                                                            ISNULL(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                    END < 0 then
                                                                                                                                                                 0
                                                                                                                                                             else
                                                                                                                                                                 isnull(
                                                                                                                                                                           BP_MESU_FE_MENGE,
                                                                                                                                                                           0
                                                                                                                                                                       )
                                                                                                                                                                 - CASE
                                                                                                                                                                       WHEN ISNULL(
                                                                                                                                                                                      SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                      0
                                                                                                                                                                                  ) = 0 THEN
                                                                                                                                                                           isnull(
                                                                                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                     0
                                                                                                                                                                                 )
                                                                                                                                                                       ELSE
                                                                                                                                                                           ISNULL(
                                                                                                                                                                                     BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                     0
                                                                                                                                                                                 )
                                                                                                                                                                   END
                                                                                                                                                         end
                                                                                                                                                     else
                                                                                                                                                         case
                                                                                                                                                             when isnull(
                                                                                                                                                                            BP_MESU_FE_MENGE,
                                                                                                                                                                            0
                                                                                                                                                                        )
                                                                                                                                                                  - CASE
                                                                                                                                                                        WHEN ISNULL(
                                                                                                                                                                                       SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                       0
                                                                                                                                                                                   ) = 0 THEN
                                                                                                                                                                            isnull(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                        ELSE
                                                                                                                                                                            ISNULL(
                                                                                                                                                                                      BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                      0
                                                                                                                                                                                  )
                                                                                                                                                                    END < 0 then
                                                                                                                                                                 0
                                                                                                                                                             else
                                                                                                                                                                 round(
                                                                                                                                                                          (isnull(
                                                                                                                                                                                     BP_MESU_FE_MENGE,
                                                                                                                                                                                     0
                                                                                                                                                                                 )
                                                                                                                                                                           - CASE
                                                                                                                                                                                 WHEN ISNULL(
                                                                                                                                                                                                SUMME_LGBEWE_SKKALP,
                                                                                                                                                                                                0
                                                                                                                                                                                            ) = 0 THEN
                                                                                                                                                                                     isnull(
                                                                                                                                                                                               BP_LIEF_MENGE_SUMME,
                                                                                                                                                                                               0
                                                                                                                                                                                           )
                                                                                                                                                                                 ELSE
                                                                                                                                                                                     ISNULL(
                                                                                                                                                                                               BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                                               0
                                                                                                                                                                                           )
                                                                                                                                                                             END
                                                                                                                                                                          )
                                                                                                                                                                          * isnull(
                                                                                                                                                                                      BP_MESU_GEWICHT_NETTO,
                                                                                                                                                                                      0
                                                                                                                                                                                  ),
                                                                                                                                                                          4
                                                                                                                                                                      )
                                                                                                                                                         end
                                                                                                                                                 end
                                                                                                                                             else
                                                                                                                                                 case
                                                                                                                                                     when isnull(
                                                                                                                                                                    BP_MESU_FE_MENGE,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                          - CASE
                                                                                                                                                                WHEN ISNULL(
                                                                                                                                                                               SUMME_LGBEWE_SKKALP,
                                                                                                                                                                               0
                                                                                                                                                                           ) = 0 THEN
                                                                                                                                                                    isnull(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                                ELSE
                                                                                                                                                                    ISNULL(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                            END <= 0 then
                                                                                                                                                         0
                                                                                                                                                     else
                                                                                                                                                         1
                                                                                                                                                 end
                                                                                                                                         end
                                                                                                                                      )
                                                                                                                                      - ISNULL(
                                                                                                                                                  SUMME_LGBEWE_SKKALP,
                                                                                                                                                  0
                                                                                                                                              ) <= 0 THEN
                                                                                                                                     0
                                                                                                                                 ELSE
                                                                                                                     (KP_MENGE
                                                                                                                      * case
                                                                                                                            when KP_TYP_MENGE_BASIS = 0 then
                                                                                                                                case
                                                                                                                                    when KP_HK_MENGE_BASIS = 0 then
                                                                                                                                        case
                                                                                                                                            when isnull(
                                                                                                                                                           BP_MESU_FE_MENGE,
                                                                                                                                                           0
                                                                                                                                                       )
                                                                                                                                                 - CASE
                                                                                                                                                       WHEN ISNULL(
                                                                                                                                                                      SUMME_LGBEWE_SKKALP,
                                                                                                                                                                      0
                                                                                                                                                                  ) = 0 THEN
                                                                                                                                                           isnull(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                       ELSE
                                                                                                                                                           ISNULL(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                   END < 0 then
                                                                                                                                                0
                                                                                                                                            else
                                                                                                                                                isnull(
                                                                                                                                                          BP_MESU_FE_MENGE,
                                                                                                                                                          0
                                                                                                                                                      )
                                                                                                                                                - CASE
                                                                                                                                                      WHEN ISNULL(
                                                                                                                                                                     SUMME_LGBEWE_SKKALP,
                                                                                                                                                                     0
                                                                                                                                                                 ) = 0 THEN
                                                                                                                                                          isnull(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                      ELSE
                                                                                                                                                          ISNULL(
                                                                                                                                                                    BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                  END
                                                                                                                                        end
                                                                                                                                    else
                                                                                                                                        case
                                                                                                                                            when isnull(
                                                                                                                                                           BP_MESU_FE_MENGE,
                                                                                                                                                           0
                                                                                                                                                       )
                                                                                                                                                 - CASE
                                                                                                                                                       WHEN ISNULL(
                                                                                                                                                                      SUMME_LGBEWE_SKKALP,
                                                                                                                                                                      0
                                                                                                                                                                  ) = 0 THEN
                                                                                                                                                           isnull(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                       ELSE
                                                                                                                                                           ISNULL(
                                                                                                                                                                     BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                     0
                                                                                                                                                                 )
                                                                                                                                                   END < 0 then
                                                                                                                                                0
                                                                                                                                            else
                                                                                                                                                round(
                                                                                                                                                         (isnull(
                                                                                                                                                                    BP_MESU_FE_MENGE,
                                                                                                                                                                    0
                                                                                                                                                                )
                                                                                                                                                          - CASE
                                                                                                                                                                WHEN ISNULL(
                                                                                                                                                                               SUMME_LGBEWE_SKKALP,
                                                                                                                                                                               0
                                                                                                                                                                           ) = 0 THEN
                                                                                                                                                                    isnull(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                                ELSE
                                                                                                                                                                    ISNULL(
                                                                                                                                                                              BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                                              0
                                                                                                                                                                          )
                                                                                                                                                            END
                                                                                                                                                         )
                                                                                                                                                         * isnull(
                                                                                                                                                                     BP_MESU_GEWICHT_NETTO,
                                                                                                                                                                     0
                                                                                                                                                                 ),
                                                                                                                                                         4
                                                                                                                                                     )
                                                                                                                                        end
                                                                                                                                end
                                                                                                                            else
                                                                                                                                case
                                                                                                                                    when isnull(
                                                                                                                                                   BP_MESU_FE_MENGE,
                                                                                                                                                   0
                                                                                                                                               )
                                                                                                                                         - CASE
                                                                                                                                               WHEN ISNULL(
                                                                                                                                                              SUMME_LGBEWE_SKKALP,
                                                                                                                                                              0
                                                                                                                                                          ) = 0 THEN
                                                                                                                                                   isnull(
                                                                                                                                                             BP_LIEF_MENGE_SUMME,
                                                                                                                                                             0
                                                                                                                                                         )
                                                                                                                                               ELSE
                                                                                                                                                   ISNULL(
                                                                                                                                                             BP_LIEF_MENGE_SUMME_MANUELL,
                                                                                                                                                             0
                                                                                                                                                         )
                                                                                                                                           END <= 0 then
                                                                                                                                        0
                                                                                                                                    else
                                                                                                                                        1
                                                                                                                                end
                                                                                                                        end
                                                                                                                     )
                                                                                                                     - ISNULL(
                                                                                                                                 SUMME_LGBEWE_SKKALP,
                                                                                                                                 0
                                                                                                                             )
                                                                                                                             END
                                                                                                                     END,
                                                                                                                     0
                                                                                                                 ),
                                                                                                           4
                                                                                                       )
                                                                                              ELSE
                                                                                                  0
                                                                                          END,
                                                       KP_IDAR
                                                FROM((((((((tSK_KALP
                                                    LEFT JOIN
                                                    (
                                                        SELECT SUM(ISNULL(KPLG_MENGE, 0)) AS SUMME_LGBEWE_SKKALP,
                                                               KPLG_IDSKKP
                                                        FROM tSK_KALP_LGBEWE
                                                        GROUP BY KPLG_IDSKKP
                                                    ) AS tSUMME_LGBEWE_SKKALP
                                                        ON tSUMME_LGBEWE_SKKALP.KPLG_IDSKKP = tSK_KALP.ID)
                                                    RIGHT JOIN
                                                    (SELECT * FROM tSK_KALK WHERE KK_TYP_LAGER_BUCHUNG = 1) AS tSK_KALK
                                                        ON tSK_KALK.ID = tSK_KALP.KP_IDSKKK)
                                                    RIGHT JOIN
                                                    (SELECT * FROM tBE_BELP) AS tBE_BELP
                                                        ON tBE_BELP.ID = CASE
                                                                             WHEN ISNULL(tSK_KALK.KK_IDBEBP, 0) <> 0 THEN
                                                                                 ISNULL(tSK_KALK.KK_IDBEBP, 0)
                                                                             WHEN ISNULL(tSK_KALK.KK_IDBEBP_BASIS, 0) <> 0 THEN
                                                                                 ISNULL(tSK_KALK.KK_IDBEBP_BASIS, 0)
                                                                         END)
                                                    RIGHT JOIN
                                                    (
                                                        SELECT tBE_BELK_BKBE.*,
                                                               'BKBE_BELEG_ART' = BK_BKBE_TYP_BELEG_ART
                                                        FROM tBE_BELK_BKBE
                                                        WHERE BK_BKBE_TYP_BELEG = 2
                                                              AND BK_BKBE_STATUS_BEARBEITUNG = 0
                                                    ) AS tBE_BELK_BKBE
                                                        ON tBE_BELK_BKBE.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK)
                                                    LEFT JOIN
                                                    (SELECT * FROM tBE_BELK_BKBE_AU) AS tBE_BELK_BKBE_AU
                                                        ON tBE_BELK_BKBE_AU.BK_BKBE_AU_IDBKBE = tBE_BELK_BKBE.ID
                                                    LEFT JOIN
                                                    (
                                                        SELECT BP_MESU_FE_MENGE,
                                                               BP_MESU_GEWICHT_NETTO,
                                                               BP_MESU_IDBEBP
                                                        FROM tBE_BELP_MESU
                                                    ) AS tBE_BELP_MESU
                                                        ON tBE_BELP_MESU.BP_MESU_IDBEBP = tBE_BELP.ID)
                                                    LEFT JOIN tLG_ORTE
                                                        ON tLG_ORTE.ID = tSK_KALP.KP_IDLGOR
                                                    LEFT JOIN
                                                    (
                                                        SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME,
                                                               BP_LIEF_IDBEBP
                                                        FROM
                                                        (
                                                            SELECT tBE_BELP_LIEF.*
                                                            FROM tBE_BELP_LIEF
                                                                LEFT JOIN
                                                                (
                                                                    SELECT ID,
                                                                           BP_IDBEBK
                                                                    FROM tBE_BELP
                                                                    WHERE BP_POSITION_TYP = 0
                                                                ) AS tBE_BELP
                                                                    ON tBE_BELP.ID = tBE_BELP_LIEF.BP_LIEF_IDBEBP
                                                                INNER JOIN
                                                                (
                                                                    SELECT BK_BKBE_IDBEBK
                                                                    FROM tBE_BELK_BKBE
                                                                    WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                          AND BK_BKBE_TYP_BELEG = 2
                                                                ) AS tBE_BELK_BKBE_OFFEN
                                                                    ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                        ) AS tBE_BELP_LIEF
                                                        WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                                                              AND BP_LIEF_STATUS_LIEFERUNG = 0
                                                              AND BP_LIEF_TYP_BEWEGUNG = 0
                                                        GROUP BY BP_LIEF_IDBEBP
                                                    ) AS tBE_BELP_LIEF
                                                        ON tBE_BELP_LIEF.BP_LIEF_IDBEBP = tBE_BELP.ID)
                                                    LEFT JOIN
                                                    (
                                                        SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME_MANUELL,
                                                               BP_LIEF_IDBEBP
                                                        FROM
                                                        (
                                                            SELECT tBE_BELP_LIEF.*
                                                            FROM tBE_BELP_LIEF
                                                                LEFT JOIN
                                                                (
                                                                    SELECT ID,
                                                                           BP_IDBEBK
                                                                    FROM tBE_BELP
                                                                    WHERE BP_POSITION_TYP = 0
                                                                ) AS tBE_BELP
                                                                    ON tBE_BELP.ID = tBE_BELP_LIEF.BP_LIEF_IDBEBP
                                                                INNER JOIN
                                                                (
                                                                    SELECT BK_BKBE_IDBEBK
                                                                    FROM tBE_BELK_BKBE
                                                                    WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                          AND BK_BKBE_TYP_BELEG = 2
                                                                ) AS tBE_BELK_BKBE_OFFEN
                                                                    ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                        ) AS tBE_BELP_LIEF
                                                        WHERE BP_LIEF_TYP = 0
                                                              AND BP_LIEF_TYP_BEARBEITUNG = 0
                                                              AND BP_LIEF_STATUS_LIEFERUNG = 0
                                                              AND BP_LIEF_TYP_BEWEGUNG = 0
                                                        GROUP BY BP_LIEF_IDBEBP
                                                    ) AS tBE_BELP_LIEF_MANUELL
                                                        ON tBE_BELP_LIEF_MANUELL.BP_LIEF_IDBEBP = tBE_BELP.ID)
                                                    LEFT JOIN
                                                    (
                                                        SELECT ID AS KK_ID_UNTEREBENE,
                                                               KK_TYP_LAGER_BUCHUNG AS KK_TYP_LAGER_BUCHUNG_UNTEREBENE
                                                        FROM tSK_KALK
                                                    ) AS tSK_KALK_UNTEREBENE
                                                        ON tSK_KALK_UNTEREBENE.KK_ID_UNTEREBENE = tSK_KALP.KP_IDSKKK_POS)
                                                    LEFT JOIN
                                                    (
                                                        SELECT SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUMME_LIEF,
                                                               BP_LIEF_IDBEBP
                                                        FROM
                                                        (
                                                            SELECT tBE_BELP_LIEF.*
                                                            FROM tBE_BELP_LIEF
                                                                LEFT JOIN
                                                                (
                                                                    SELECT ID,
                                                                           BP_IDBEBK
                                                                    FROM tBE_BELP
                                                                    WHERE BP_POSITION_TYP = 0
                                                                ) AS tBE_BELP
                                                                    ON tBE_BELP.ID = tBE_BELP_LIEF.BP_LIEF_IDBEBP
                                                                INNER JOIN
                                                                (
                                                                    SELECT BK_BKBE_IDBEBK
                                                                    FROM tBE_BELK_BKBE
                                                                    WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                                          AND BK_BKBE_TYP_BELEG = 2
                                                                ) AS tBE_BELK_BKBE_OFFEN
                                                                    ON tBE_BELK_BKBE_OFFEN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
                                                        ) AS tBE_BELP_LIEF
                                                        WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                                                              AND BP_LIEF_STATUS_LIEFERUNG = 0
                                                              AND BP_LIEF_TYP_BEWEGUNG = 0
                                                        GROUP BY BP_LIEF_IDBEBP
                                                    ) AS tBE_BELP_LIEF_SUMME_LIEF
                                                        ON tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_IDBEBP = tBE_BELP.ID
                                                WHERE (
                                                          KP_TYP_POSITION = 0
                                                          OR (
                                                                 KP_TYP_POSITION = 1
                                                                 AND ISNULL(KK_TYP_LAGER_BUCHUNG_UNTEREBENE, -1) = 0
                                                             )
                                                      )
                                                      AND KP_IDAR IS NOT NULL
                                                      AND BK_BKBE_TYP_BELEG = 2
                                                      AND BK_BKBE_STATUS_BEARBEITUNG = 0
                                                      AND KK_TYP_LAGER_BUCHUNG = 1
                                                      AND KP_LAGER_STATUS_BUCHUNG = 0
                                                      AND (
                                                              (ISNULL(KP_IDLGOR, 0) = 0)
                                                              OR (
                                                                     ISNULL(KP_IDLGOR, 0) > 0
                                                                     AND ISNULL(tLG_ORTE.LO_STATUS, 0) = 0
                                                                 )
                                                          )
                                            ) AS tSK_KALP
                                            GROUP BY KP_IDSKKK,
                                                     KP_IDAR
                                        ) AS tSK_KALP
                                    ) AS tSK_KALP_BESTAND_AUFTRAG_1
                                    GROUP BY KP_IDAR
                                ) AS tSK_KALP_BESTAND_AUFTRAG
                                    ON tSK_KALP_BESTAND_AUFTRAG.LG_AU_IDAR_SK = tARST.ID)
                        ) AS tBE_BELP_BESTAND_AUFTRAG
                            ON tBE_BELP_BESTAND_AUFTRAG.LG_AU_IDAR_AR = LG_KENNZ_IDAR)
                        LEFT JOIN
                        (
                            SELECT BP_IDAR,
                                   SUM(   CASE
                                              WHEN CASE
                                                       WHEN tEK_BELP.BP_LI_DATUM IS NULL
                                                            AND tEK_BELK_BKBE_BE.BK_BKBE_BE_LI_DATUM IS NULL THEN
                                                           0
                                                       ELSE
                                                           1
                                                   END = 1 THEN
                                                  CASE
                                                      WHEN tEK_BELP_MESU.BP_MESU_FE_MENGE IS NOT NULL
                                                           AND tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME IS NOT NULL THEN
                                                          CASE
                                                              WHEN tEK_BELP_MESU.BP_MESU_FE_MENGE
                                                                   - tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME < 0 THEN
                                                                  0
                                                              ELSE
                                                                  tEK_BELP_MESU.BP_MESU_FE_MENGE
                                                                  - tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME
                                                          END
                                                      ELSE
                                                          CASE
                                                              WHEN tEK_BELP_MESU.BP_MESU_FE_MENGE IS NOT NULL THEN
                                                                  tEK_BELP_MESU.BP_MESU_FE_MENGE
                                                              ELSE
                                                                  CASE
                                                                      WHEN tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME IS NOT NULL THEN
                                                                          tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME * -1
                                                                      ELSE
                                                                          0
                                                                  END
                                                          END
                                                  END
                                              ELSE
                                                  0
                                          END
                                      ) As LG_BESTAND_BESTELLT,
                                   SUM(   CASE
                                              WHEN CASE
                                                       WHEN tEK_BELP.BP_LI_DATUM IS NULL
                                                            AND tEK_BELK_BKBE_BE.BK_BKBE_BE_LI_DATUM IS NULL THEN
                                                           0
                                                       ELSE
                                                           1
                                                   END = 0 THEN
                                                  CASE
                                                      WHEN tEK_BELP_MESU.BP_MESU_FE_MENGE IS NOT NULL
                                                           AND tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME IS NOT NULL THEN
                                                          CASE
                                                              WHEN tEK_BELP_MESU.BP_MESU_FE_MENGE
                                                                   - tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME < 0 THEN
                                                                  0
                                                              ELSE
                                                                  tEK_BELP_MESU.BP_MESU_FE_MENGE
                                                                  - tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME
                                                          END
                                                      ELSE
                                                          CASE
                                                              WHEN tEK_BELP_MESU.BP_MESU_FE_MENGE IS NOT NULL THEN
                                                                  tEK_BELP_MESU.BP_MESU_FE_MENGE
                                                              ELSE
                                                                  CASE
                                                                      WHEN tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME IS NOT NULL THEN
                                                                          tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME * -1
                                                                      ELSE
                                                                          0
                                                                  END
                                                          END
                                                  END
                                              ELSE
                                                  0
                                          END
                                      ) As LG_BESTAND_BESTELLT_OHNE_TERMIN
                            FROM(((((tEK_BELP
                                LEFT JOIN
                                (
                                    SELECT BP_MESU_IDEKBP,
                                           CASE
                                               WHEN ISNULL(BP_MESU_EK_IDAD, 0) = 0 THEN
                                                   BP_MESU_FE_MENGE
                                               ELSE
                                                   CASE
                                                       WHEN BP_MESU_EK_AD_FAKTOR = 0 THEN
                                                           0
                                                       ELSE
                                                           BP_MESU_FE_MENGE / BP_MESU_EK_AD_FAKTOR
                                                   END
                                           END AS BP_MESU_FE_MENGE
                                    FROM tEK_BELP_MESU
                                ) AS tEK_BELP_MESU
                                    ON tEK_BELP_MESU.BP_MESU_IDEKBP = tEK_BELP.ID)
                                LEFT JOIN
                                (
                                    SELECT BP_LIEF_IDEKBP,
                                           SUM(   CASE
                                                      WHEN ISNULL(tEK_BELP_MESU.BP_MESU_EK_IDAD, 0) = 0 THEN
                                                          BP_LIEF_MENGE
                                                      ELSE
                                                          CASE
                                                              WHEN ISNULL(tEK_BELP_MESU.BP_MESU_EK_AD_FAKTOR, 0) = 0 THEN
                                                                  0
                                                              ELSE
                                                                  BP_LIEF_MENGE / tEK_BELP_MESU.BP_MESU_EK_AD_FAKTOR
                                                          END
                                                  END
                                              ) AS BP_LIEF_MENGE_SUMME
                                    FROM
                                    (
                                        SELECT tEK_BELP_LIEF.*
                                        FROM tEK_BELP_LIEF
                                            LEFT JOIN
                                            (
                                                SELECT ID,
                                                       BP_IDEKBK
                                                FROM tEK_BELP
                                                WHERE BP_POSITION_TYP = 0
                                            ) AS tEK_BELP
                                                ON tEK_BELP.ID = tEK_BELP_LIEF.BP_LIEF_IDEKBP
                                            INNER JOIN
                                            (
                                                SELECT BK_BKBE_IDEKBK
                                                FROM tEK_BELK_BKBE
                                                WHERE BK_BKBE_STATUS_BEARBEITUNG = 0
                                                      AND BK_BKBE_TYP_BELEG = 2
                                            ) AS tEK_BELK_BKBE_OFFEN
                                                ON tEK_BELK_BKBE_OFFEN.BK_BKBE_IDEKBK = tEK_BELP.BP_IDEKBK
                                    ) AS tEK_BELP_LIEF
                                        LEFT JOIN tEK_BELP_MESU AS tEK_BELP_MESU
                                            ON tEK_BELP_MESU.BP_MESU_IDEKBP = tEK_BELP_LIEF.BP_LIEF_IDEKBP
                                    WHERE BP_LIEF_TYP_BEARBEITUNG = 0
                                    GROUP BY BP_LIEF_IDEKBP
                                ) AS tEK_BELP_LIEF
                                    ON tEK_BELP_LIEF.BP_LIEF_IDEKBP = tEK_BELP.ID)
                                LEFT JOIN tEK_BELK_BKBE
                                    ON tEK_BELK_BKBE.BK_BKBE_IDEKBK = tEK_BELP.BP_IDEKBK)
                                LEFT JOIN tEK_BELK_ALLG
                                    ON tEK_BELK_ALLG.BK_ALLG_IDEKBK = tEK_BELP.BP_IDEKBK)
                                LEFT JOIN tEK_BELK_BKBE_BE
                                    ON tEK_BELK_BKBE_BE.BK_BKBE_BE_IDBKEK = tEK_BELK_BKBE.ID)
                            WHERE BK_BKBE_TYP_BELEG = 2
                                  AND BK_BKBE_STATUS_BEARBEITUNG = 0
                                  AND (
                                          (
                                              (
                                              (
                                                  ISNULL(tEK_BELP.BP_IDBEBKBE_AU, 0) = 0
                                                  AND ISNULL(tEK_BELK_ALLG.BK_ALLG_IDBEBKBE_AU, 0) = 0
                                                  AND ISNULL(tEK_BELP.BP_IDPVPK, 0) = 0
                                                  AND ISNULL(tEK_BELK_ALLG.BK_ALLG_IDPVPK, 0) = 0
                                              )
                                              )
                                              OR BP_TYP_LAGER_BUCHUNG_EK_PROJEKT = 1
                                          )
                                          AND BP_LAGER_STATUS_BUCHUNG = 0
                                      )
                            GROUP BY tEK_BELP.BP_IDAR
                        ) AS tEK_BELP_BESTAND_BESTELLT
                            ON tEK_BELP_BESTAND_BESTELLT.BP_IDAR = LG_KENNZ_IDAR)
                ) AS tLG_KENNZ
            ) AS tLG_KENNZ
        ) AS tLG_KENNZ
            ON tLG_KENNZ.LG_KENNZ_IDAR = tBE_BELP.BP_IDAR)
        LEFT JOIN
        (
            SELECT COUNT(ID) AS Anzahl,
                   MSR_ID_REFERENZ
            FROM
            (
                SELECT tMSG_MESS.ID,
                       MSR_ID_REFERENZ
                FROM tMSG_MESS
                    INNER JOIN
                    (
                        SELECT MSR_IDMS,
                               MSR_ID_REFERENZ
                        FROM tMSG_MESS_REFERENZ
                        WHERE MSR_TYP_ID_REFERENZ = 2
                    ) AS tMSG_MESS_REFERENZ
                        ON tMSG_MESS_REFERENZ.MSR_IDMS = tMSG_MESS.ID
                WHERE MS_TYP = 1
                      AND MS_TYP_STATUS = 1
                      AND MS_TYP_SICHTBARKEIT = 0
            ) AS T
            GROUP BY MSR_ID_REFERENZ
        ) AS tMSAufabenVorhanden
            ON tMSAufabenVorhanden.MSR_ID_REFERENZ = tBE_BELP.ID)
        LEFT JOIN
        (
            SELECT COUNT(ID) AS Anzahl,
                   MSR_ID_REFERENZ
            FROM
            (
                SELECT tMSG_MESS.ID,
                       MSR_ID_REFERENZ
                FROM tMSG_MESS
                    INNER JOIN
                    (
                        SELECT MSR_IDMS,
                               MSR_ID_REFERENZ
                        FROM tMSG_MESS_REFERENZ
                        WHERE MSR_TYP_ID_REFERENZ = 2
                    ) AS tMSG_MESS_REFERENZ
                        ON tMSG_MESS_REFERENZ.MSR_IDMS = tMSG_MESS.ID
                WHERE MS_TYP = 0
                      AND MS_TYP_STATUS = 1
                      AND MS_TYP_SICHTBARKEIT = 0
            ) AS T
            GROUP BY MSR_ID_REFERENZ
        ) AS tMSMessageVorhanden
            ON tMSMessageVorhanden.MSR_ID_REFERENZ = tBE_BELP.ID)
        LEFT JOIN
        (
            SELECT COUNT(ID) AS Anzahl,
                   MSR_ID_REFERENZ
            FROM
            (
                SELECT tMSG_MESS.ID,
                       MSR_ID_REFERENZ
                FROM tMSG_MESS
                    INNER JOIN
                    (
                        SELECT MSR_IDMS,
                               MSR_ID_REFERENZ
                        FROM tMSG_MESS_REFERENZ
                        WHERE MSR_TYP_ID_REFERENZ = 2
                    ) AS tMSG_MESS_REFERENZ
                        ON tMSG_MESS_REFERENZ.MSR_IDMS = tMSG_MESS.ID
                WHERE MS_TYP = 2
                      AND MS_TYP_STATUS = 1
                      AND MS_TYP_SICHTBARKEIT = 0
            ) AS T
            GROUP BY MSR_ID_REFERENZ
        ) AS tMSNotizenVorhanden
            ON tMSNotizenVorhanden.MSR_ID_REFERENZ = tBE_BELP.ID)
    WHERE tBE_BELK.BK_IDMA = 8
          AND case
                  when tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG = 0 then
                      case
                          when tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF is not null then
                              case
                                  when tBE_BELP_MESU.BP_MESU_FE_MENGE < 0 then
                                      case
                                          when (tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                + (tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF * -1)
                                               ) < 0 then
                                              0
                                          else
                                              1
                                      end
                                  else
                                      case
                                          when (tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                - tBE_BELP_LIEF_SUMME_LIEF.BP_LIEF_MENGE_SUMME_LIEF
                                               ) > 0 then
                                              0
                                          else
                                              1
                                      end
                              end
                          else
                              tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
                      end
                  else
                      tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG
              end = 0
          AND tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG = 0
          AND tBE_BELK.BK_TYP_BELEG = 2
          AND tBE_BELK_BKBE.BK_BKBE_TYP_BELEG_ART = 0
          AND CASE
                  WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG > 0 THEN
                      tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG - 1
                  ELSE
                      tBE_BELP.BP_PP_ZUSTAND_PLANUNG
              END = 0
          AND tBE_BELP.BP_POSITION_TYP = 0
          AND tBE_BELK_BKBE.BK_BKBE_STATUS_BEARBEITUNG <> 2
) AS MATRIX
WHERE (
          (
              (
                  MATRIX.BP_MESU_FE_MENGE < 0
                  and MATRIX.BP_MENGE_REST < 0
              )
              or (
                     MATRIX.BP_MESU_FE_MENGE > 0
                     and MATRIX.BP_MENGE_REST > 0
                 )
          )
          or MATRIX.BP_MESU_FE_MENGE = 0
      )
      AND (
              (
                  MATRIX.BK_BKBE_AU_LI_DATUM <= '23.07.2026'
                  AND MATRIX.BK_BKBE_AU_LI_DATUM >= '23.06.2026'
              )
              OR DATEDIFF(D, GETDATE(), MATRIX.BK_BKBE_AU_LI_DATUM) < 1
          )
ORDER BY MATRIX.BK_BKBE_AU_LI_DATUM ASC,
         MATRIX.BK_BKBE_NUMMER,
         MATRIX.BP_POSITION_NUMMER
go