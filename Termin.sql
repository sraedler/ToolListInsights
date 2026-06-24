SELECT CASE
           WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDPSKP, 0) <> 0 THEN
               tPPS_ARBSCHR.AS_NUMMER
           ELSE
               CASE
                   WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDSKKP, 0) <> 0 THEN
                       tARST_KALK.AR_KALK_NUMMER
                   ELSE
                       ''
               END
       END AS AS_NUMMER,
       PSPP_DATUM_START,
       BP_PP_PRIORITAET_PLANUNG,
       KF_STATUS,
       0 AS PSP_SP_KONTROLLE,
       ISNULL(tAG_BEWE.AGBW_STATUS_BEARBEITUNG, -1) AS AGBW_STATUS_BEARBEITUNG,
       'BP_LI_TERMIN' = CASE
                            WHEN BP_PP_DATUM_TERMIN IS NOT NULL THEN
                                BP_PP_DATUM_TERMIN
                            ELSE
                                CASE
                                    WHEN BP_LI_DATUM IS NOT NULL THEN
                                        BP_LI_DATUM
                                    ELSE
                                        BK_BKBE_AU_LI_DATUM
                                END
                        END,
       CASE
           WHEN (CASE
                     WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDPSKP, 0) <> 0 THEN
                         CASE
                             WHEN PSP_TYP_POSITION = 1
                                  OR PSP_TYP_POSITION = 2 THEN
                                 CASE
                                     WHEN PSP_PP_STATUS_PRODUKTION = 0 THEN
                                         CASE
                                             WHEN
                                             (
                                                 SELECT COUNT(tPPS_SKKALP_STATUS_PROD.PSP_POSITION_NUMMER) AS POS_NUMMER_ERLEDIGT
                                                 FROM
                                                 (SELECT * FROM tPPS_SKKALP) AS tPPS_SKKALP_STATUS_PROD
                                                 WHERE tPPS_SKKALP_STATUS_PROD.PSP_IDPSKKK = tPPS_SKKALP.PSP_IDPSKKK
                                                       And tPPS_SKKALP_STATUS_PROD.PSP_POSITION_NUMMER > tPPS_SKKALP.PSP_POSITION_NUMMER
                                                       AND CASE
                                                               WHEN EXISTS
                                                 (
                                                     SELECT *
                                                     FROM tPPS_SKKALP_ZU
                                                     WHERE tPPS_SKKALP_ZU.PSZ_IDPSP = tPPS_SKKALP.ID
                                                 )   THEN
                                                                   CASE
                                                                       WHEN tPPS_SKKALP_STATUS_PROD.ID IN (
                                                                                                              SELECT PSZ_IDPSP_ZU
                                                                                                              FROM tPPS_SKKALP_ZU
                                                                                                              WHERE tPPS_SKKALP_ZU.PSZ_IDPSP = tPPS_SKKALP.ID
                                                                                                          ) THEN
                                                                           1
                                                                       ELSE
                                                                           0
                                                                   END
                                                               ELSE
                                                                   CASE
                                                                       WHEN tPPS_SKKALP_STATUS_PROD.PSP_POSITION_NUMMER >=
                                                                       (
                                                                           SELECT MIN(PSP_POSITION_NUMMER) AS PSP_POSITION_NUMMER_MIN_FA
                                                                           FROM tPPS_SKKALP AS tPPS_SKKALP_FA
                                                                           WHERE tPPS_SKKALP_FA.PSP_IDPSKKK = tPPS_SKKALP.PSP_IDPSKKK
                                                                                 AND tPPS_SKKALP_FA.PSP_POSITION_NUMMER > tPPS_SKKALP.PSP_POSITION_NUMMER
                                                                                 AND tPPS_SKKALP_FA.PSP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                       ) THEN
                                                                           0
                                                                       ELSE
                                                                           CASE
                                                                               WHEN tPPS_SKKALP_STATUS_PROD.PSP_POSITION_NUMMER >=
                                                                               (
                                                                                   SELECT MIN(KP_POSITION_NUMMER) AS KP_POSITION_NUMMER_MIN_FA
                                                                                   FROM tSK_KALP AS tSK_KALP_FA
                                                                                       LEFT JOIN tSK_KALK
                                                                                           ON tSK_KALK.ID = tSK_KALP_FA.KP_IDSKKK
                                                                                       LEFT JOIN tBE_BELP
                                                                                           ON tBE_BELP.ID = tSK_KALK.KK_IDBEBP
                                                                                       LEFT JOIN tPPS_SKKALK AS tPPS_SKKALK_KALK_FA
                                                                                           ON tPPS_SKKALK_KALK_FA.PSK_IDBEBP = tBE_BELP.ID
                                                                                   WHERE tPPS_SKKALK_KALK_FA.ID = tPPS_SKKALP.PSP_IDPSKKK
                                                                                         AND tSK_KALP_FA.KP_POSITION_NUMMER > tPPS_SKKALP.PSP_POSITION_NUMMER
                                                                                         AND tSK_KALP_FA.KP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                               ) THEN
                                                                                   0
                                                                               ELSE
                                                                                   1
                                                                           END
                                                                   END
                                                           END = 1
                                                       AND (
                                                               tPPS_SKKALP_STATUS_PROD.PSP_PP_STATUS_PRODUKTION = 1
                                                               OR (CASE
                                                                       WHEN tPPS_SKKALP_STATUS_PROD.PSP_TYP_POSITION = 0
                                                                            AND EXISTS
                                                 (
                                                     SELECT *
                                                     FROM tZE_BUCH
                                                     WHERE tZE_BUCH.ZBU_IDPSKP = tPPS_SKKALP_STATUS_PROD.ID
                                                 )             THEN
                                                                           1
                                                                       ELSE
                                                                           0
                                                                   END = 1
                                                                  )
                                                           )
                                             ) >= CASE
                                                      WHEN EXISTS
                                                           (
                                                               SELECT *
                                                               FROM tPPS_SKKALP_ZU
                                                               WHERE tPPS_SKKALP_ZU.PSZ_IDPSP = tPPS_SKKALP.ID
                                                           ) THEN
                                                      (
                                                          SELECT COUNT(PSZ_IDPSP_ZU)
                                                          FROM tPPS_SKKALP_ZU
                                                          WHERE tPPS_SKKALP_ZU.PSZ_IDPSP = tPPS_SKKALP.ID
                                                      )
                                                      ELSE
                                                          1
                                                  END THEN
                                                 1
                                             ELSE
                                                 0
                                         END
                                     ELSE
                                         PSP_PP_STATUS_PRODUKTION
                                 END
                             ELSE
                                 PSP_PP_STATUS_PRODUKTION
                         END
                     ELSE
                         CASE
                             WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDSKKP, 0) <> 0 THEN
                                 CASE
                                     WHEN tARST_KALK.AR_ART = 0
                                          AND tPPS_SKKALK_SK.PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT = 1
                                          AND (
                                                  (
                                                      tSK_KALP.KP_TYP_LAGER_BUCHUNG_AUFTRAG = 0
                                                      AND tSK_KALK.KK_TYP_LAGER_BUCHUNG_AUFTRAG = 1
                                                  )
                                                  OR tSK_KALP.KP_TYP_LAGER_BUCHUNG_AUFTRAG = 2
                                              ) THEN
                                         CASE
                                             WHEN ISNULL(
                                                  (
                                                      SELECT SUM(KPLG_MENGE) AS KPLG_MENGE_SUM
                                                      FROM tSK_KALP_LGBEWE
                                                      WHERE tSK_KALP_LGBEWE.KPLG_IDSKKP = tSK_KALP.ID
                                                  ),
                                                  0
                                                        ) >= ROUND(
                                                                      KP_MENGE
                                                                      * ISNULL(
                                                                                  CASE
                                                                                      WHEN tSK_KALP.KP_TYP_MENGE_BASIS = 0 THEN
                                                                                          CASE
                                                                                              WHEN tSK_KALP.KP_HK_MENGE_BASIS = 0 THEN
                                                                                                  tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                              ELSE
                                                                                                  ROUND(
                                                                                                           tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                           * tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO,
                                                                                                           4
                                                                                                       )
                                                                                          END
                                                                                      ELSE
                                                                                          1
                                                                                  END,
                                                                                  0
                                                                              ),
                                                                      2
                                                                  ) THEN
                                                 1
                                             ELSE
                                                 0
                                         END
                                     WHEN tARST_KALK.AR_ART = 1
                                          AND tPPS_SKKALK_SK.PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT = 1 THEN
                                         CASE
                                             WHEN ISNULL(
                                                  (
                                                      SELECT SUM(KP_BEST_MENGE) AS MENGE_BESTELLT
                                                      FROM tSK_KALP_BEST
                                                      WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                            AND KP_BEST_TYP_BEARBEITUNG = 0
                                                            AND KP_BEST_TYP <> 2
                                                  ),
                                                  0
                                                        ) >= ROUND(
                                                                      KP_MENGE
                                                                      * ISNULL(
                                                                                  CASE
                                                                                      WHEN tSK_KALP.KP_TYP_MENGE_BASIS = 0 THEN
                                                                                          CASE
                                                                                              WHEN tSK_KALP.KP_HK_MENGE_BASIS = 0 THEN
                                                                                                  tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                              ELSE
                                                                                                  ROUND(
                                                                                                           tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                           * tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO,
                                                                                                           4
                                                                                                       )
                                                                                          END
                                                                                      ELSE
                                                                                          1
                                                                                  END,
                                                                                  0
                                                                              ),
                                                                      2
                                                                  ) THEN
                                                 CASE
                                                     WHEN ISNULL(
                                                          (
                                                              SELECT SUM(BP_LIEF_MENGE) AS MENGE_GELIEFERT
                                                              FROM tSK_KALP_BEST
                                                                  LEFT JOIN tEK_BELP_LIEF
                                                                      ON tEK_BELP_LIEF.BP_LIEF_IDEKBP = tSK_KALP_BEST.KP_BEST_IDEKBP_BEST
                                                              WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                    AND ISNULL(KP_BEST_IDEKBP_BEST, 0) <> 0
                                                                    AND BP_LIEF_TYP_BEARBEITUNG = 0
                                                                    AND KP_BEST_TYP <> 2
                                                          ),
                                                          0
                                                                ) >= ISNULL(
                                                                     (
                                                                         SELECT SUM(KP_BEST_MENGE) AS MENGE_BESTELLT_BELEG
                                                                         FROM tSK_KALP_BEST
                                                                         WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                               AND ISNULL(KP_BEST_IDEKBP_BEST, 0) <> 0
                                                                               AND KP_BEST_TYP <> 2
                                                                     ),
                                                                     0
                                                                           ) THEN
                                                         1
                                                     ELSE
                                                         0
                                                 END
                                             ELSE
                                                 0
                                         END
                                     ELSE
                                         CASE
                                             WHEN EXISTS
                                                  (
                                                      SELECT *
                                                      FROM tSK_KALP_BEST
                                                      WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                            AND KP_BEST_TYP_BEARBEITUNG = 0
                                                            AND KP_BEST_TYP <> 2
                                                  ) THEN
                                                 1
                                             ELSE
                                                 CASE
                                                     WHEN
                                                     (
                                                         SELECT COUNT(tPPS_SKKALP.PSP_POSITION_NUMMER) AS POS_NUMMER_ERLEDIGT
                                                         FROM tPPS_SKKALP
                                                         WHERE PSP_IDPSKKK = tPPS_SKKALK_SK.KK_IDPSKKK
                                                               And PSP_POSITION_NUMMER > KP_POSITION_NUMMER
                                                               AND CASE
                                                                       WHEN EXISTS
                                                         (
                                                             SELECT * FROM tPPS_SKKALP_ZU WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                                         )   THEN
                                                                           CASE
                                                                               WHEN tPPS_SKKALP.ID IN (
                                                                                                          SELECT PSZ_IDPSP_ZU
                                                                                                          FROM tPPS_SKKALP_ZU
                                                                                                          WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                                                                                      ) THEN
                                                                                   1
                                                                               ELSE
                                                                                   0
                                                                           END
                                                                       ELSE
                                                                           CASE
                                                                               WHEN tPPS_SKKALP.PSP_POSITION_NUMMER >=
                                                                               (
                                                                                   SELECT MIN(PSP_POSITION_NUMMER) AS PSP_POSITION_NUMMER_MIN_FA
                                                                                   FROM tPPS_SKKALP AS tPPS_SKKALP_FA
                                                                                   WHERE tPPS_SKKALP_FA.PSP_IDPSKKK = tPPS_SKKALK_SK.KK_IDPSKKK
                                                                                         AND tPPS_SKKALP_FA.PSP_POSITION_NUMMER > KP_POSITION_NUMMER
                                                                                         AND tPPS_SKKALP_FA.PSP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                               ) THEN
                                                                                   0
                                                                               ELSE
                                                                                   CASE
                                                                                       WHEN tPPS_SKKALP.PSP_POSITION_NUMMER >=
                                                                                       (
                                                                                           SELECT MIN(KP_POSITION_NUMMER) AS KP_POSITION_NUMMER_MIN_FA
                                                                                           FROM tSK_KALP AS tSK_KALP_FA
                                                                                           WHERE tSK_KALP_FA.KP_IDSKKK = tSK_KALP.KP_IDSKKK
                                                                                                 AND tSK_KALP_FA.KP_POSITION_NUMMER > tSK_KALP.KP_POSITION_NUMMER
                                                                                                 AND tSK_KALP_FA.KP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                                       ) THEN
                                                                                           0
                                                                                       ELSE
                                                                                           1
                                                                                   END
                                                                           END
                                                                   END = 1
                                                               AND (
                                                                       PSP_PP_STATUS_PRODUKTION = 1
                                                                       OR (CASE
                                                                               WHEN PSP_TYP_POSITION = 0
                                                                                    AND EXISTS
                                                         (
                                                             SELECT * FROM tZE_BUCH WHERE tZE_BUCH.ZBU_IDPSKP = tPPS_SKKALP.ID
                                                         )             THEN
                                                                                   1
                                                                               ELSE
                                                                                   0
                                                                           END = 1
                                                                          )
                                                                   )
                                                     ) >= CASE
                                                              WHEN EXISTS
                                                                   (
                                                                       SELECT * FROM tPPS_SKKALP_ZU WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                                                   ) THEN
                                                              (
                                                                  SELECT COUNT(PSZ_IDPSP_ZU)
                                                                  FROM tPPS_SKKALP_ZU
                                                                  WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                                              )
                                                              ELSE
                                                                  1
                                                          END THEN
                                                         1
                                                     ELSE
                                                         0
                                                 END
                                         END
                                 END
                             ELSE
                                 ''
                         END
                 END
                ) = 1 THEN
               1
           ELSE
               PSPP_STATUS_PRODUKTION
       END AS PSPP_STATUS_PROD,
       BK_BKBE_NUMMER,
       BP_POSITION_NUMMER,
       CASE
           WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDPSKP, 0) <> 0 THEN
               tPPS_SKKALP.PSP_POSITION_NUMMER
           ELSE
               CASE
                   WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDSKKP, 0) <> 0 THEN
                       tSK_KALP.KP_POSITION_NUMMER
                   ELSE
                       ''
               END
       END AS PSP_POSITION_NUMMER,
       AR_NUMMER,
       BP_ARTIKEL_BEZEICHNUNG,
       'BP_PP_ZUSTAND_PLANUNG' = CASE
                                     WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG > 0 THEN
                                         tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG - 1
                                     ELSE
                                         tBE_BELP.BP_PP_ZUSTAND_PLANUNG
                                 END,
       'PSP_ZEIT_SOLL_TAG' = PSPP_ZEIT,
       PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL,
       PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL,
       ISNULL(tPPS_SKKALP.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL, 0)
       + ISNULL(tPPS_SKKALP.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL, 0) AS PSP_ZEIT_MINUTEN_GESAMT_SOLL,
       CASE
           WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDPSKP, 0) <> 0 THEN
               BP_MESU_FE_MENGE
           ELSE
               CASE
                   WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDSKKP, 0) <> 0 THEN
                       tSK_KALP.KP_MENGE * BP_MESU_FE_MENGE
                   ELSE
                       ''
               END
       END AS BP_MESU_FE_MENGE,
       tKAGO.KG_FARBE AS KG_FARBE,
       tADRS.AD_NAME1 AS AD_NAME1,
       0 AS D4IV_SUMME_ZEIT_KAPAZITAET,
       0 AS D4IV_SUMME_ZEIT_SOLL_TAG,
       CASE
           WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDPSKP, 0) <> 0 THEN
               ISNULL(CAST(tPPS_SKKALP.PSP_PP_DATUM_START AS VARCHAR(100)), '')
           ELSE
               CASE
                   WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDSKKP, 0) <> 0 THEN
                       ISNULL(CAST(tSK_KALP.KP_PP_DATUM_START AS VARCHAR(100)), '')
                   ELSE
                       ''
               END
       END AS D4IV_PP_DATUM_START,
       ISNULL(CAST(BP_PP_DATUM_START AS VARCHAR(100)), '') AS D4IV_BP_PP_DATUM_START,
       tKAGO.KG_BEZEICHNUNG AS D4IV_KG_BEZEICHNUNG,
       tAG_BEWE.ID AS D4IV_AGBEWE_IDAGBW,
       CAST(CASE
                WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDPSKP, 0) <> 0 THEN
                    tPPS_SKKALP.PSP_POSITION_NUMMER
                ELSE
                    CASE
                        WHEN ISNULL(tPPS_SKKALP_PLAN.PSPP_IDSKKP, 0) <> 0 THEN
                            tSK_KALP.KP_POSITION_NUMMER
                        ELSE
                            ''
                    END
            END AS VARCHAR(100)) AS D4IV_POSITION_NUMMER,
       tBE_BELP.ID AS D4IV_IDBEBP,
       tPPS_SKKALP_PLAN.ID AS ID
FROM((((((((((((((((((((((((((tPPS_SKKALP_PLAN
    LEFT JOIN tPPS_SKKALP
        ON tPPS_SKKALP.ID = tPPS_SKKALP_PLAN.PSPP_IDPSKP)
    LEFT JOIN tPPS_ARBSCHR
        ON tPPS_ARBSCHR.ID = tPPS_SKKALP.PSP_IDAS)
    LEFT JOIN tPPS_MASTA
        ON tPPS_MASTA.ID = tPPS_SKKALP.PSP_IDMS)
    LEFT JOIN tPPS_MASCHPOOL
        ON tPPS_MASCHPOOL.ID = tPPS_SKKALP.PSP_IDMP)
    LEFT JOIN tMARB
        ON tMARB.ID = tPPS_SKKALP.PSP_IDMR)
    LEFT JOIN tADRS AS tADRS_MARB
        ON tADRS_MARB.ID = tMARB.MA_IDAD)
    LEFT JOIN tPPS_SKKALK
        ON tPPS_SKKALK.ID = tPPS_SKKALP.PSP_IDPSKKK)
    LEFT JOIN tSK_KALP
        ON tSK_KALP.ID = tPPS_SKKALP_PLAN.PSPP_IDSKKP)
    LEFT JOIN tSK_KALK
        ON tSK_KALK.ID = tSK_KALP.KP_IDSKKK)
    LEFT JOIN
    (
        SELECT ID AS KK_IDPSKKK,
               PSK_IDBEBP AS KK_PSK_IDBEBP,
               PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT,
               PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT
        FROM tPPS_SKKALK
    ) AS tPPS_SKKALK_SK
        ON tPPS_SKKALK_SK.KK_PSK_IDBEBP = tSK_KALK.KK_IDBEBP)
    LEFT JOIN tBE_BELP
        ON (
               tBE_BELP.ID = tPPS_SKKALK.PSK_IDBEBP
               OR tBE_BELP.ID = tSK_KALK.KK_IDBEBP
           ))
    LEFT JOIN tBE_BELP_MESU
        ON tBE_BELP_MESU.BP_MESU_IDBEBP = tBE_BELP.ID)
    LEFT JOIN tARDI
        ON tARDI.ID = tBE_BELP.BP_FE_IDAD)
    LEFT JOIN tARST
        ON tARST.ID = tBE_BELP.BP_IDAR)
    LEFT JOIN tBE_BELK
        ON tBE_BELK.ID = tBE_BELP.BP_IDBEBK)
    LEFT JOIN tBE_BELK_ALLG
        ON tBE_BELK_ALLG.BK_ALLG_IDBEBK = tBE_BELK.ID)
    LEFT JOIN tBE_BELK_BKBE
        ON tBE_BELK_BKBE.BK_BKBE_IDBEBK = tBE_BELK.ID)
    LEFT JOIN tBE_BELK_BKBE_AU
        ON tBE_BELK_BKBE_AU.BK_BKBE_AU_IDBKBE = tBE_BELK_BKBE.ID)
    LEFT JOIN tNUKR
        ON tNUKR.ID = tBE_BELK_BKBE.BK_BKBE_IDNK)
    LEFT JOIN tKUND
        ON tKUND.ID = tBE_BELK_BKBE.BK_BKBE_IDKU_RE)
    LEFT JOIN tADRS
        ON tADRS.ID = tKUND.KU_IDAD)
    LEFT JOIN
    (
        SELECT ID AS ID_AR_KALK,
               AR_NUMMER AS AR_KALK_NUMMER,
               AR_BEZEICHNUNG AS AR_KALK_BEZEICHNUNG,
               AR_ART
        FROM tARST
    ) AS tARST_KALK
        ON tARST_KALK.ID_AR_KALK = tSK_KALP.KP_IDAR)
    LEFT JOIN
    (
        SELECT ID AS ID_AD_KALK,
               AD_NUMMER AS AD_KALK_NUMMER,
               AD_BEZEICHNUNG AS AD_KALK_BEZEICHNUNG
        FROM tARDI
    ) AS tARDI_KALK
        ON tARDI_KALK.ID_AD_KALK = tSK_KALP.KP_IDAD)
    LEFT JOIN
    (
        SELECT CASE
                   WHEN ISNULL(tPPS_PP_KFMI.KM_IDPSPP, 0) > 0 THEN
                       1
                   ELSE
                       0
               END AS KF_STATUS,
               KM_IDPSPP,
               tPPS_PP_KONFLIKT.ID AS KF_ID,
               tPPS_PP_KONFLIKT.KF_NUMMER,
               tPPS_PP_KONFLIKT.KF_BEZEICHNUNG,
               CAST(tPPS_PP_KONFLIKT.KF_INFOTEXT As varchar(4000)) As KF_INFOTEXT,
               tPPS_PP_KONFLIKT.KF_SCHWEREGRAD,
               CASE
                   WHEN KF_TYP = 14 THEN
                       CASE
                           WHEN ISNULL(IDPSP, 0) <> 0 THEN
                               tPPS_SKKALP_JOIN.BP_POSITION_NUMMER + SPACE(1) + tPPS_SKKALP_JOIN.BP_ARTIKEL_NUMMER
                               + CHAR(13) + CHAR(10) + CAST(tPPS_SKKALP_JOIN.BP_ARTIKEL_BEZEICHNUNG AS VARCHAR(2000))
                           ELSE
                               CASE
                                   WHEN ISNULL(IDSKP, 0) <> 0 THEN
                                       tSK_KALP_JOIN.BP_POSITION_NUMMER + SPACE(1) + tSK_KALP_JOIN.BP_ARTIKEL_NUMMER
                                       + CHAR(13) + CHAR(10)
                                       + CAST(tSK_KALP_JOIN.BP_ARTIKEL_BEZEICHNUNG AS VARCHAR(2000))
                                   ELSE
                                       ''
                               END
                       END
                   ELSE
                       CASE
                           WHEN ISNULL(IDPSP, 0) <> 0 THEN
                               PSP_POSITION_NUMMER + SPACE(1) + AS_NUMMER + CHAR(13) + CHAR(10)
                               + CAST(PSP_BEZEICHNUNG AS VARCHAR(2000))
                           ELSE
                               CASE
                                   WHEN ISNULL(IDSKP, 0) <> 0 THEN
                                       KP_POSITION_NUMMER + SPACE(1) + AR_NUMMER + CHAR(13) + CHAR(10)
                                       + CAST(KP_BEZEICHNUNG AS VARCHAR(2000))
                                   ELSE
                                       ''
                               END
                       END
               END AS KF_KONFLIKTPARTNER
        FROM tPPS_PP_KFMI
            INNER JOIN
            (SELECT * FROM tPPS_PP_KONFLIKT) AS tPPS_PP_KONFLIKT
                ON tPPS_PP_KONFLIKT.ID = tPPS_PP_KFMI.KM_IDKF
            LEFT JOIN tPPS_SKKALP_PLAN AS tPPS_SKKALP_PLAN_KFPT
                ON tPPS_SKKALP_PLAN_KFPT.ID = tPPS_PP_KFMI.KM_IDPSPP_KFP
            LEFT JOIN
            (
                SELECT tPPS_SKKALP.ID AS IDPSP,
                       PSP_POSITION_NUMMER,
                       AS_NUMMER,
                       CAST(PSP_BEZEICHNUNG AS VARCHAR(2000)) AS PSP_BEZEICHNUNG,
                       BP_POSITION_NUMMER,
                       tARST_BELP.AR_NUMMER AS BP_ARTIKEL_NUMMER,
                       CAST(BP_ARTIKEL_BEZEICHNUNG AS VARCHAR(2000)) AS BP_ARTIKEL_BEZEICHNUNG
                FROM tPPS_SKKALP
                    LEFT JOIN tPPS_ARBSCHR
                        ON tPPS_ARBSCHR.ID = tPPS_SKKALP.PSP_IDAS
                    LEFT JOIN tPPS_SKKALK
                        ON tPPS_SKKALK.ID = tPPS_SKKALP.PSP_IDPSKKK
                    LEFT JOIN tBE_BELP
                        ON tBE_BELP.ID = tPPS_SKKALK.PSK_IDBEBP
                    LEFT JOIN tARST AS tARST_BELP
                        ON tARST_BELP.ID = tBE_BELP.BP_IDAR
            ) AS tPPS_SKKALP_JOIN
                ON tPPS_SKKALP_JOIN.IDPSP = tPPS_SKKALP_PLAN_KFPT.PSPP_IDPSKP
            LEFT JOIN
            (
                SELECT tSK_KALP.ID AS IDSKP,
                       KP_POSITION_NUMMER,
                       tARST.AR_NUMMER AS AR_NUMMER,
                       CAST(KP_BEZEICHNUNG AS VARCHAR(2000)) AS KP_BEZEICHNUNG,
                       BP_POSITION_NUMMER,
                       tARST_BELP.AR_NUMMER AS BP_ARTIKEL_NUMMER,
                       CAST(BP_ARTIKEL_BEZEICHNUNG AS VARCHAR(2000)) AS BP_ARTIKEL_BEZEICHNUNG
                FROM tSK_KALP
                    LEFT JOIN tARST
                        ON tARST.ID = tSK_KALP.KP_IDAR
                    LEFT JOIN tSK_KALK
                        ON tSK_KALK.ID = tSK_KALP.KP_IDSKKK
                    LEFT JOIN tBE_BELP
                        ON tBE_BELP.ID = tSK_KALK.KK_IDBEBP
                    LEFT JOIN tARST AS tARST_BELP
                        ON tARST_BELP.ID = tBE_BELP.BP_IDAR
            ) AS tSK_KALP_JOIN
                ON tSK_KALP_JOIN.IDSKP = tPPS_SKKALP_PLAN_KFPT.PSPP_IDSKKP
        WHERE tPPS_PP_KFMI.ID = ISNULL(
                                (
                                    SELECT TOP 1
                                        tPPS_PP_KFMI_OFFEN.ID
                                    FROM
                                    (
                                        SELECT *
                                        FROM tPPS_PP_KFMI AS tPPS_PP_KFMI_OFFEN
                                        WHERE tPPS_PP_KFMI_OFFEN.KM_IDPSPP = tPPS_PP_KFMI.KM_IDPSPP
                                    ) AS tPPS_PP_KFMI_OFFEN
                                        LEFT JOIN tPPS_SKKALP_PLAN AS tPPS_SKKALP_PLAN_OFFEN
                                            ON tPPS_SKKALP_PLAN_OFFEN.ID = tPPS_PP_KFMI_OFFEN.KM_IDPSPP
                                        LEFT JOIN
                                        (
                                            SELECT tPPS_PP_KONFLIKT.ID,
                                                   CASE tPPS_PP_KONFLIKT.KF_SCHWEREGRAD
                                                       WHEN 0 THEN
                                                           1
                                                       WHEN 1 THEN
                                                           0
                                                       ELSE
                                                           tPPS_PP_KONFLIKT.KF_SCHWEREGRAD
                                                   END AS KF_SCHWEREGRAD
                                            FROM tPPS_PP_KONFLIKT
                                        ) AS tPPS_PP_KONFLIKT
                                            ON tPPS_PP_KONFLIKT.ID = tPPS_PP_KFMI_OFFEN.KM_IDKF
                                        LEFT JOIN tPPS_SKKALP
                                            ON tPPS_SKKALP.ID = tPPS_SKKALP_PLAN_OFFEN.PSPP_IDPSKP
                                        LEFT JOIN tSK_KALP
                                            ON tSK_KALP.ID = tPPS_SKKALP_PLAN_OFFEN.PSPP_IDSKKP
                                        LEFT JOIN tARST
                                            ON tARST.ID = tSK_KALP.KP_IDAR
                                        LEFT JOIN tPPS_SKKALK
                                            ON tPPS_SKKALK.ID = tPPS_SKKALP.PSP_IDPSKKK
                                        LEFT JOIN tSK_KALK
                                            ON tSK_KALK.ID = tSK_KALP.KP_IDSKKK
                                        LEFT JOIN
                                        (
                                            SELECT ID AS KK_IDPSKKK,
                                                   PSK_IDBEBP AS KK_PSK_IDBEBP,
                                                   PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT AS KK_PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT,
                                                   PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT AS KK_PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT
                                            FROM tPPS_SKKALK
                                        ) AS tPPS_SKKALK_SK
                                            ON tPPS_SKKALK_SK.KK_PSK_IDBEBP = tSK_KALK.KK_IDBEBP
                                        LEFT JOIN tPPS_SKKALP_PLAN AS tPPS_SKKALP_PLAN_KFPT_OFFEN
                                            ON tPPS_SKKALP_PLAN_KFPT_OFFEN.ID = tPPS_PP_KFMI_OFFEN.KM_IDPSPP_KFP
                                        LEFT JOIN tPPS_SKKALP AS tPPS_SKKALP_KFPT
                                            ON tPPS_SKKALP_KFPT.ID = tPPS_SKKALP_PLAN_KFPT_OFFEN.PSPP_IDPSKP
                                        LEFT JOIN tSK_KALP AS tSK_KALP_KFPT
                                            ON tSK_KALP_KFPT.ID = tPPS_SKKALP_PLAN_KFPT_OFFEN.PSPP_IDSKKP
                                        LEFT JOIN tARST AS tARST_KFPT
                                            ON tARST_KFPT.ID = tSK_KALP_KFPT.KP_IDAR
                                        LEFT JOIN tSK_KALK AS tSK_KALK_KFPT
                                            ON tSK_KALK_KFPT.ID = tSK_KALP_KFPT.KP_IDSKKK
                                        LEFT JOIN
                                        (
                                            SELECT ID AS KK_IDPSKKK,
                                                   PSK_IDBEBP AS KK_PSK_IDBEBP,
                                                   PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT AS KK_PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT,
                                                   PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT AS KK_PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT
                                            FROM tPPS_SKKALK
                                        ) AS tPPS_SKKALK_SK_KFPT
                                            ON tPPS_SKKALK_SK_KFPT.KK_PSK_IDBEBP = tSK_KALK_KFPT.KK_IDBEBP
                                        LEFT JOIN tPPS_SKKALK AS tPPS_SKKALK_KFPT
                                            ON tPPS_SKKALK_KFPT.ID = tPPS_SKKALP_KFPT.PSP_IDPSKKK
                                        LEFT JOIN tBE_BELP AS tBE_BELP_KFPT
                                            ON tBE_BELP_KFPT.ID = tPPS_SKKALK_KFPT.PSK_IDBEBP
                                               OR tBE_BELP_KFPT.ID = tPPS_SKKALK_SK_KFPT.KK_PSK_IDBEBP
                                        LEFT JOIN
                                        (SELECT * FROM tBE_BELP) AS tBE_BELP
                                            ON (
                                                   tBE_BELP.ID = tPPS_SKKALK.PSK_IDBEBP
                                                   OR tBE_BELP.ID = tSK_KALK.KK_IDBEBP
                                               )
                                        LEFT JOIN tBE_BELP_MESU
                                            ON tBE_BELP_MESU.BP_MESU_IDBEBP = tBE_BELP.ID
                                        LEFT JOIN tBE_BELK
                                            ON tBE_BELK.ID = tBE_BELP.BP_IDBEBK
                                        LEFT JOIN tBE_BELK_ALLG
                                            ON tBE_BELK_ALLG.BK_ALLG_IDBEBK = tBE_BELK.ID
                                        LEFT JOIN tBE_BELK_BKBE
                                            ON tBE_BELK_BKBE.BK_BKBE_IDBEBK = tBE_BELK.ID
                                    WHERE CASE
                                              WHEN BK_BKBE_STATUS_ZEITERFASSUNG = 1
                                                   OR (
                                                          BK_BKBE_STATUS_ZEITERFASSUNG = 2
                                                          AND CONVERT(
                                                                         DATETIME,
                                                                         BK_BKBE_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM,
                                                                         104
                                                                     ) <= '23.06.2026'
                                                      ) THEN
                                                  1
                                              ELSE
                                                  CASE
                                                      WHEN tBE_BELP.BP_STATUS_ZEITERFASSUNG = 1
                                                           OR (
                                                                  tBE_BELP.BP_STATUS_ZEITERFASSUNG = 2
                                                                  AND CONVERT(
                                                                                 DATETIME,
                                                                                 tBE_BELP.BP_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM,
                                                                                 104
                                                                             ) <= '23.06.2026'
                                                              ) THEN
                                                          1
                                                      ELSE
                                                          0
                                                  END
                                          END = 0
                                          AND (CASE
                                                   WHEN ISNULL(tPPS_SKKALP_PLAN_OFFEN.PSPP_IDPSKP, 0) <> 0 THEN
                                                       tPPS_SKKALP.PSP_PP_STATUS_PRODUKTION
                                                   ELSE
                                                       CASE
                                                           WHEN ISNULL(tPPS_SKKALP_PLAN_OFFEN.PSPP_IDSKKP, 0) <> 0 THEN
                                                               CASE
                                                                   WHEN tARST.AR_ART = 0
                                                                        AND tPPS_SKKALK_SK.KK_PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT = 1
                                                                        AND (
                                                                                (
                                                                                    tSK_KALP.KP_TYP_LAGER_BUCHUNG_AUFTRAG = 0
                                                                                    AND tSK_KALK.KK_TYP_LAGER_BUCHUNG_AUFTRAG = 1
                                                                                )
                                                                                OR tSK_KALP.KP_TYP_LAGER_BUCHUNG_AUFTRAG = 2
                                                                            ) THEN
                                                                       CASE
                                                                           WHEN ISNULL(
                                                                                (
                                                                                    SELECT SUM(KPLG_MENGE) AS KPLG_MENGE_SUM
                                                                                    FROM tSK_KALP_LGBEWE
                                                                                    WHERE tSK_KALP_LGBEWE.KPLG_IDSKKP = tSK_KALP.ID
                                                                                ),
                                                                                0
                                                                                      ) >= ROUND(
                                                                                                    tSK_KALP.KP_MENGE
                                                                                                    * ISNULL(
                                                                                                                CASE
                                                                                                                    WHEN tSK_KALP.KP_TYP_MENGE_BASIS = 0 THEN
                                                                                                                        CASE
                                                                                                                            WHEN tSK_KALP.KP_HK_MENGE_BASIS = 0 THEN
                                                                                                                                tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                            ELSE
                                                                                                                                ROUND(
                                                                                                                                         tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                                         * tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO,
                                                                                                                                         4
                                                                                                                                     )
                                                                                                                        END
                                                                                                                    ELSE
                                                                                                                        1
                                                                                                                END,
                                                                                                                0
                                                                                                            ),
                                                                                                    2
                                                                                                ) THEN
                                                                               1
                                                                           ELSE
                                                                               0
                                                                       END
                                                                   WHEN tARST.AR_ART = 1
                                                                        AND tPPS_SKKALK_SK.KK_PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT = 1 THEN
                                                                       CASE
                                                                           WHEN ISNULL(
                                                                                (
                                                                                    SELECT SUM(KP_BEST_MENGE) AS MENGE_BESTELLT
                                                                                    FROM tSK_KALP_BEST
                                                                                    WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                                          AND KP_BEST_TYP_BEARBEITUNG = 0
                                                                                          AND KP_BEST_TYP <> 2
                                                                                ),
                                                                                0
                                                                                      ) >= ROUND(
                                                                                                    tSK_KALP.KP_MENGE
                                                                                                    * ISNULL(
                                                                                                                CASE
                                                                                                                    WHEN tSK_KALP.KP_TYP_MENGE_BASIS = 0 THEN
                                                                                                                        CASE
                                                                                                                            WHEN tSK_KALP.KP_HK_MENGE_BASIS = 0 THEN
                                                                                                                                tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                            ELSE
                                                                                                                                ROUND(
                                                                                                                                         tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                                         * tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO,
                                                                                                                                         4
                                                                                                                                     )
                                                                                                                        END
                                                                                                                    ELSE
                                                                                                                        1
                                                                                                                END,
                                                                                                                0
                                                                                                            ),
                                                                                                    2
                                                                                                ) THEN
                                                                               CASE
                                                                                   WHEN ISNULL(
                                                                                        (
                                                                                            SELECT SUM(BP_LIEF_MENGE) AS MENGE_GELIEFERT
                                                                                            FROM tSK_KALP_BEST
                                                                                                LEFT JOIN tEK_BELP_LIEF
                                                                                                    ON tEK_BELP_LIEF.BP_LIEF_IDEKBP = tSK_KALP_BEST.KP_BEST_IDEKBP_BEST
                                                                                            WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                                                  AND ISNULL(
                                                                                                                KP_BEST_IDEKBP_BEST,
                                                                                                                0
                                                                                                            ) <> 0
                                                                                                  AND BP_LIEF_TYP_BEARBEITUNG = 0
                                                                                                  AND KP_BEST_TYP <> 2
                                                                                        ),
                                                                                        0
                                                                                              ) >= ISNULL(
                                                                                                   (
                                                                                                       SELECT SUM(KP_BEST_MENGE) AS MENGE_BESTELLT_BELEG
                                                                                                       FROM tSK_KALP_BEST
                                                                                                       WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                                                             AND ISNULL(
                                                                                                                           KP_BEST_IDEKBP_BEST,
                                                                                                                           0
                                                                                                                       ) <> 0
                                                                                                             AND KP_BEST_TYP <> 2
                                                                                                   ),
                                                                                                   0
                                                                                                         ) THEN
                                                                                       1
                                                                                   ELSE
                                                                                       0
                                                                               END
                                                                           ELSE
                                                                               0
                                                                       END
                                                                   ELSE
                                                                       CASE
                                                                           WHEN EXISTS
                                    (
                                        SELECT *
                                        FROM tSK_KALP_BEST
                                        WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                              AND KP_BEST_TYP_BEARBEITUNG = 0
                                              AND KP_BEST_TYP <> 2
                                    )   THEN
                                                                               1
                                                                           ELSE
                                                                               CASE
                                                                                   WHEN
                                                                                   (
                                                                                       SELECT COUNT(tPPS_SKKALP_INT.PSP_POSITION_NUMMER) AS POS_NUMMER_ERLEDIGT
                                                                                       FROM tPPS_SKKALP AS tPPS_SKKALP_INT
                                                                                       WHERE tPPS_SKKALP_INT.PSP_IDPSKKK = tPPS_SKKALK_SK.KK_IDPSKKK
                                                                                             And tPPS_SKKALP_INT.PSP_POSITION_NUMMER > tSK_KALP.KP_POSITION_NUMMER
                                                                                             AND CASE
                                                                                                     WHEN EXISTS
                                                                                       (
                                                                                           SELECT * FROM tPPS_SKKALP_ZU WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                                                                       )   THEN
                                                                                                         CASE
                                                                                                             WHEN tPPS_SKKALP_INT.ID IN (
                                                                                                                                            SELECT PSZ_IDPSP_ZU
                                                                                                                                            FROM tPPS_SKKALP_ZU
                                                                                                                                            WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                                                                                                                        ) THEN
                                                                                                                 1
                                                                                                             ELSE
                                                                                                                 0
                                                                                                         END
                                                                                                     ELSE
                                                                                                         CASE
                                                                                                             WHEN tPPS_SKKALP_INT.PSP_POSITION_NUMMER >=
                                                                                                             (
                                                                                                                 SELECT MIN(PSP_POSITION_NUMMER) AS PSP_POSITION_NUMMER_MIN_FA
                                                                                                                 FROM tPPS_SKKALP AS tPPS_SKKALP_FA
                                                                                                                 WHERE tPPS_SKKALP_FA.PSP_IDPSKKK = tPPS_SKKALK_SK.KK_IDPSKKK
                                                                                                                       AND tPPS_SKKALP_FA.PSP_POSITION_NUMMER > tSK_KALP.KP_POSITION_NUMMER
                                                                                                                       AND tPPS_SKKALP_FA.PSP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                                                             ) THEN
                                                                                                                 0
                                                                                                             ELSE
                                                                                                                 CASE
                                                                                                                     WHEN tPPS_SKKALP_INT.PSP_POSITION_NUMMER >=
                                                                                                                     (
                                                                                                                         SELECT MIN(KP_POSITION_NUMMER) AS KP_POSITION_NUMMER_MIN_FA
                                                                                                                         FROM tSK_KALP AS tSK_KALP_FA
                                                                                                                         WHERE tSK_KALP_FA.KP_IDSKKK = tSK_KALP.KP_IDSKKK
                                                                                                                               AND tSK_KALP_FA.KP_POSITION_NUMMER > tSK_KALP.KP_POSITION_NUMMER
                                                                                                                               AND tSK_KALP_FA.KP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                                                                     ) THEN
                                                                                                                         0
                                                                                                                     ELSE
                                                                                                                         1
                                                                                                                 END
                                                                                                         END
                                                                                                 END = 1
                                                                                             AND (
                                                                                                     tPPS_SKKALP_INT.PSP_PP_STATUS_PRODUKTION = 1
                                                                                                     OR (CASE
                                                                                                             WHEN tPPS_SKKALP_INT.PSP_TYP_POSITION = 0
                                                                                                                  AND EXISTS
                                                                                       (
                                                                                           SELECT * FROM tZE_BUCH WHERE tZE_BUCH.ZBU_IDPSKP = tPPS_SKKALP_INT.ID
                                                                                       )             THEN
                                                                                                                 1
                                                                                                             ELSE
                                                                                                                 0
                                                                                                         END = 1
                                                                                                        )
                                                                                                 )
                                                                                   ) >= CASE
                                                                                            WHEN EXISTS
                                    (
                                        SELECT * FROM tPPS_SKKALP_ZU WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                    )   THEN
                                                                                            (
                                                                                                SELECT COUNT(PSZ_IDPSP_ZU)
                                                                                                FROM tPPS_SKKALP_ZU
                                                                                                WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                                                                                            )
                                                                                            ELSE
                                                                                                1
                                                                                        END THEN
                                                                                       1
                                                                                   ELSE
                                                                                       0
                                                                               END
                                                                       END
                                                               END
                                                           ELSE
                                                               ''
                                                       END
                                               END = 0
                                              )
                                          AND tPPS_SKKALP_PLAN_OFFEN.PSPP_STATUS_PRODUKTION = 0
                                          AND CASE
                                                  WHEN ISNULL(tPPS_PP_KFMI_OFFEN.KM_IDPSPP_KFP, 0) <> 0 THEN
                                        (CASE
                                             WHEN ISNULL(tPPS_SKKALP_PLAN_KFPT_OFFEN.PSPP_IDPSKP, 0) <> 0 THEN
                                                 tPPS_SKKALP_KFPT.PSP_PP_STATUS_PRODUKTION
                                             ELSE
                                                 CASE
                                                     WHEN ISNULL(tPPS_SKKALP_PLAN_KFPT_OFFEN.PSPP_IDSKKP, 0) <> 0 THEN
                                                         CASE
                                                             WHEN tARST_KFPT.AR_ART = 0
                                                                  AND tPPS_SKKALK_SK_KFPT.KK_PSK_TYP_PP_BER_MATERIAL_VERFUEGBARKEIT = 1
                                                                  AND (
                                                                          (
                                                                              tSK_KALP_KFPT.KP_TYP_LAGER_BUCHUNG_AUFTRAG = 0
                                                                              AND tSK_KALK.KK_TYP_LAGER_BUCHUNG_AUFTRAG = 1
                                                                          )
                                                                          OR tSK_KALP_KFPT.KP_TYP_LAGER_BUCHUNG_AUFTRAG = 2
                                                                      ) THEN
                                                                 CASE
                                                                     WHEN ISNULL(
                                                                          (
                                                                              SELECT SUM(KPLG_MENGE) AS KPLG_MENGE_SUM
                                                                              FROM tSK_KALP_LGBEWE
                                                                              WHERE tSK_KALP_LGBEWE.KPLG_IDSKKP = tSK_KALP_KFPT.ID
                                                                          ),
                                                                          0
                                                                                ) >= ROUND(
                                                                                              tSK_KALP_KFPT.KP_MENGE
                                                                                              * ISNULL(
                                                                                                          CASE
                                                                                                              WHEN tSK_KALP_KFPT.KP_TYP_MENGE_BASIS = 0 THEN
                                                                                                                  CASE
                                                                                                                      WHEN tSK_KALP_KFPT.KP_HK_MENGE_BASIS = 0 THEN
                                                                                                                          tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                      ELSE
                                                                                                                          ROUND(
                                                                                                                                   tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                                   * tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO,
                                                                                                                                   4
                                                                                                                               )
                                                                                                                  END
                                                                                                              ELSE
                                                                                                                  1
                                                                                                          END,
                                                                                                          0
                                                                                                      ),
                                                                                              2
                                                                                          ) THEN
                                                                         1
                                                                     ELSE
                                                                         0
                                                                 END
                                                             WHEN tARST_KFPT.AR_ART = 1
                                                                  AND tPPS_SKKALK_SK_KFPT.KK_PSK_TYP_PP_BER_FREMDLEISTUNG_VERFUEGBARKEIT = 1 THEN
                                                                 CASE
                                                                     WHEN ISNULL(
                                                                          (
                                                                              SELECT SUM(KP_BEST_MENGE) AS MENGE_BESTELLT
                                                                              FROM tSK_KALP_BEST
                                                                              WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                                    AND KP_BEST_TYP_BEARBEITUNG = 0
                                                                                    AND KP_BEST_TYP <> 2
                                                                          ),
                                                                          0
                                                                                ) >= ROUND(
                                                                                              tSK_KALP_KFPT.KP_MENGE
                                                                                              * ISNULL(
                                                                                                          CASE
                                                                                                              WHEN tSK_KALP_KFPT.KP_TYP_MENGE_BASIS = 0 THEN
                                                                                                                  CASE
                                                                                                                      WHEN tSK_KALP_KFPT.KP_HK_MENGE_BASIS = 0 THEN
                                                                                                                          tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                      ELSE
                                                                                                                          ROUND(
                                                                                                                                   tBE_BELP_MESU.BP_MESU_FE_MENGE
                                                                                                                                   * tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO,
                                                                                                                                   4
                                                                                                                               )
                                                                                                                  END
                                                                                                              ELSE
                                                                                                                  1
                                                                                                          END,
                                                                                                          0
                                                                                                      ),
                                                                                              2
                                                                                          ) THEN
                                                                         CASE
                                                                             WHEN ISNULL(
                                                                                  (
                                                                                      SELECT SUM(BP_LIEF_MENGE) AS MENGE_GELIEFERT
                                                                                      FROM tSK_KALP_BEST
                                                                                          LEFT JOIN tEK_BELP_LIEF
                                                                                              ON tEK_BELP_LIEF.BP_LIEF_IDEKBP = tSK_KALP_BEST.KP_BEST_IDEKBP_BEST
                                                                                      WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                                            AND ISNULL(
                                                                                                          KP_BEST_IDEKBP_BEST,
                                                                                                          0
                                                                                                      ) <> 0
                                                                                            AND BP_LIEF_TYP_BEARBEITUNG = 0
                                                                                            AND KP_BEST_TYP <> 2
                                                                                  ),
                                                                                  0
                                                                                        ) >= ISNULL(
                                                                                             (
                                                                                                 SELECT SUM(KP_BEST_MENGE) AS MENGE_BESTELLT_BELEG
                                                                                                 FROM tSK_KALP_BEST
                                                                                                 WHERE KP_BEST_IDSKKP = tSK_KALP.ID
                                                                                                       AND ISNULL(
                                                                                                                     KP_BEST_IDEKBP_BEST,
                                                                                                                     0
                                                                                                                 ) <> 0
                                                                                                       AND KP_BEST_TYP <> 2
                                                                                             ),
                                                                                             0
                                                                                                   ) THEN
                                                                                 1
                                                                             ELSE
                                                                                 0
                                                                         END
                                                                     ELSE
                                                                         0
                                                                 END
                                                             ELSE
                                                                 CASE
                                                                     WHEN EXISTS
                                    (
                                        SELECT *
                                        FROM tSK_KALP_BEST
                                        WHERE KP_BEST_IDSKKP = tSK_KALP_KFPT.ID
                                              AND KP_BEST_TYP_BEARBEITUNG = 0
                                              AND KP_BEST_TYP <> 2
                                    )   THEN
                                                                         1
                                                                     ELSE
                                                                         CASE
                                                                             WHEN
                                                                             (
                                                                                 SELECT COUNT(tPPS_SKKALP_INT.PSP_POSITION_NUMMER) AS POS_NUMMER_ERLEDIGT
                                                                                 FROM tPPS_SKKALP AS tPPS_SKKALP_INT
                                                                                 WHERE tPPS_SKKALP_INT.PSP_IDPSKKK = tPPS_SKKALK_SK_KFPT.KK_IDPSKKK
                                                                                       And tPPS_SKKALP_INT.PSP_POSITION_NUMMER > tSK_KALP_KFPT.KP_POSITION_NUMMER
                                                                                       AND CASE
                                                                                               WHEN EXISTS
                                                                                 (
                                                                                     SELECT *
                                                                                     FROM tPPS_SKKALP_ZU
                                                                                     WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP_KFPT.ID
                                                                                 )   THEN
                                                                                                   CASE
                                                                                                       WHEN tPPS_SKKALP_INT.ID IN (
                                                                                                                                      SELECT PSZ_IDPSP_ZU
                                                                                                                                      FROM tPPS_SKKALP_ZU
                                                                                                                                      WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP_KFPT.ID
                                                                                                                                  ) THEN
                                                                                                           1
                                                                                                       ELSE
                                                                                                           0
                                                                                                   END
                                                                                               ELSE
                                                                                                   CASE
                                                                                                       WHEN tPPS_SKKALP_INT.PSP_POSITION_NUMMER >=
                                                                                                       (
                                                                                                           SELECT MIN(PSP_POSITION_NUMMER) AS PSP_POSITION_NUMMER_MIN_FA
                                                                                                           FROM tPPS_SKKALP AS tPPS_SKKALP_FA
                                                                                                           WHERE tPPS_SKKALP_FA.PSP_IDPSKKK = tPPS_SKKALK_SK_KFPT.KK_IDPSKKK
                                                                                                                 AND tPPS_SKKALP_FA.PSP_POSITION_NUMMER > tSK_KALP_KFPT.KP_POSITION_NUMMER
                                                                                                                 AND tPPS_SKKALP_FA.PSP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                                                       ) THEN
                                                                                                           0
                                                                                                       ELSE
                                                                                                           CASE
                                                                                                               WHEN tPPS_SKKALP_INT.PSP_POSITION_NUMMER >=
                                                                                                               (
                                                                                                                   SELECT MIN(KP_POSITION_NUMMER) AS KP_POSITION_NUMMER_MIN_FA
                                                                                                                   FROM tSK_KALP AS tSK_KALP_FA
                                                                                                                   WHERE tSK_KALP_FA.KP_IDSKKK = tSK_KALP_KFPT.KP_IDSKKK
                                                                                                                         AND tSK_KALP_FA.KP_POSITION_NUMMER > tSK_KALP_KFPT.KP_POSITION_NUMMER
                                                                                                                         AND tSK_KALP_FA.KP_NEUER_FERTIGUNGSABSCHNITT = 1
                                                                                                               ) THEN
                                                                                                                   0
                                                                                                               ELSE
                                                                                                                   1
                                                                                                           END
                                                                                                   END
                                                                                           END = 1
                                                                                       AND (
                                                                                               tPPS_SKKALP_INT.PSP_PP_STATUS_PRODUKTION = 1
                                                                                               OR (CASE
                                                                                                       WHEN tPPS_SKKALP_INT.PSP_TYP_POSITION = 0
                                                                                                            AND EXISTS
                                                                                 (
                                                                                     SELECT * FROM tZE_BUCH WHERE tZE_BUCH.ZBU_IDPSKP = tPPS_SKKALP_INT.ID
                                                                                 )             THEN
                                                                                                           1
                                                                                                       ELSE
                                                                                                           0
                                                                                                   END = 1
                                                                                                  )
                                                                                           )
                                                                             ) >= CASE
                                                                                      WHEN EXISTS
                                    (
                                        SELECT *
                                        FROM tPPS_SKKALP_ZU
                                        WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP_KFPT.ID
                                    )   THEN
                                                                                      (
                                                                                          SELECT COUNT(PSZ_IDPSP_ZU)
                                                                                          FROM tPPS_SKKALP_ZU
                                                                                          WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP_KFPT.ID
                                                                                      )
                                                                                      ELSE
                                                                                          1
                                                                                  END THEN
                                                                                 1
                                                                             ELSE
                                                                                 0
                                                                         END
                                                                 END
                                                         END
                                                     ELSE
                                                         ''
                                                 END
                                         END
                                        )
                                                  ELSE
                                                      0
                                              END = 0
                                          AND CASE
                                                  WHEN tBE_BELP_KFPT.BP_STATUS_ZEITERFASSUNG = 1
                                                       OR (
                                                              tBE_BELP_KFPT.BP_STATUS_ZEITERFASSUNG = 2
                                                              AND CONVERT(
                                                                             DATETIME,
                                                                             tBE_BELP_KFPT.BP_STATUS_ZEITERFASSUNG_ERLEDIGT_DATUM,
                                                                             104
                                                                         ) <= '23.06.2026'
                                                          ) THEN
                                                      1
                                                  ELSE
                                                      0
                                              END = 0
                                    ORDER BY KF_SCHWEREGRAD DESC
                                ),
                                0
                                      )
    ) AS tKONFLIKT_TEMP
        ON tKONFLIKT_TEMP.KM_IDPSPP = tPPS_SKKALP_PLAN.ID)
    LEFT JOIN tAG_BEWE
        ON tAG_BEWE.AGBW_IDBEBP = tBE_BELP.ID)
    LEFT JOIN tKAGO
        ON tKAGO.ID = tAG_BEWE.AGBW_IDKAGO)
WHERE CONVERT(datetime, PSPP_DATUM_START, 104) >= '01.01.1900'
      AND CONVERT(datetime, PSPP_DATUM_START, 104) <= '19.04.2027'
      AND tPPS_SKKALP.PSP_IDMS = 25
      AND tNUKR.NK_TYP_PRODUKTION_PLANUNG = 0
      AND CASE
              WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG > 0 THEN
                  tBE_BELK_BKBE_AU.BK_BKBE_AU_PP_ZUSTAND_PLANUNG - 1
              ELSE
                  tBE_BELP.BP_PP_ZUSTAND_PLANUNG
          END = 0
      AND tPPS_SKKALP.PSP_TYP_POSITION = 0
ORDER BY AS_NUMMER,
         PSPP_DATUM_START,
         BP_PP_PRIORITAET_PLANUNG,
         KF_STATUS,
         PSP_SP_KONTROLLE,
         AGBW_STATUS_BEARBEITUNG,
         BP_LI_TERMIN,
         PSPP_STATUS_PROD,
         BK_BKBE_NUMMER,
         BP_POSITION_NUMMER,
         PSP_POSITION_NUMMER
go