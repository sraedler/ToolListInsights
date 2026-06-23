WITH TABLE_SKKALP
AS (SELECT CAST(ID AS INT) AS ID,
           0 AS PSP_IDPSKKK,
           CAST(KP_IDSKKK AS INT) AS PSP_IDSKKK,
           CAST(tARST.AR_ART AS INT) AS PSP_TYP_POSITION,
           CAST(KP_POSITION_NUMMER AS VARCHAR(1000)) AS PSP_POSITION_NUMMER,
           0 AS PSP_PP_STATUS_PRODUKTION,
           0 AS ZE_BUCH_SUMME_ZEIT_IST,
           1 AS PSP_TYP_HERKUNFT,
           CAST(CASE
                    WHEN BP_LIEF_MENGE_SUM >= KP_BEST_MENGE_SUM THEN
                        4
                    WHEN BP_LIEF_MENGE_SUM > 0
                         AND BP_LIEF_MENGE_SUM < KP_BEST_MENGE_SUM THEN
                        3
                    WHEN KP_BEST_MENGE_SUM > 0 THEN
                        2
                    ELSE
                        1
                END AS SMALLINT) AS KP_STATUS_BESTELLUNG_FL,
           CAST(CASE
                    WHEN AR_TYP_LAGER_BUCHUNG = 0
                         OR KP_TYP_KONTROLLE_VORGAENGER = 1 THEN
                        CASE
                            WHEN BP_LIEF_MENGE_SUM >= KP_BEST_MENGE_SUM THEN
                                4
                            WHEN BP_LIEF_MENGE_SUM > 0
                                 AND BP_LIEF_MENGE_SUM < KP_BEST_MENGE_SUM THEN
                                3
                            WHEN KP_BEST_MENGE_SUM > 0 THEN
                                2
                            WHEN ISNULL(KP_BEST_MENGE_SUM, 0) <= 0 THEN
                                4
                            ELSE
                                1
                        END
                    ELSE
                        CASE
                            WHEN LG_BESTAND_LAGER_KÖRPERLICH >= KP_MENGE_SUM THEN
                                4
                            WHEN LG_BESTAND_LAGER_KÖRPERLICH < KP_MENGE_SUM
                                 AND LG_BESTAND_LAGER_KÖRPERLICH > 0 THEN
                                2
                            ELSE
                                1
                        END
                END AS SMALLINT) AS KP_STATUS_MATERIAL,
           CAST(IDBEBP AS INT) AS IDBEBP
    FROM
    (
        SELECT tSK_KALP.*,
               CAST(
               (
                   SELECT ISNULL(LG_BESTAND_LAGER_KÖRPERLICH, 0)
                   FROM
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
                                                                              ROUND(
                                                                                       ISNULL(
                                                                                                 LG_BESTAND_LAGER_KÖRPERLICH,
                                                                                                 0
                                                                                             ),
                                                                                       4
                                                                                   )
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
                                                                               ROUND(
                                                                                        ISNULL(
                                                                                                  LG_BESTAND_PRODUKTION_ZUGANG,
                                                                                                  0
                                                                                              ),
                                                                                        4
                                                                                    )
                                                                           ELSE
                                                                               0
                                                                       END,
                                      'LG_BESTAND_PRODUKTION_ABGANG' = CASE
                                                                           WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                               ROUND(
                                                                                        ISNULL(
                                                                                                  LG_BESTAND_PRODUKTION_ABGANG,
                                                                                                  0
                                                                                              ),
                                                                                        4
                                                                                    )
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
                                             AND CONVERT(DATETIME, LBW_DATUM, 104) <= ISNULL(
                                                                                                DATEADD(
                                                                                                           day,
                                                                                                           ISNULL(
                                                                                                                     SKKALP_PP_TG_ABSTAND,
                                                                                                                     0
                                                                                                                 ),
                                                                                                           SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                       ),
                                                                                                CONVERT(
                                                                                                           DATETIME,
                                                                                                           convert(
                                                                                                                      varchar(10),
                                                                                                                      GETDATE(),
                                                                                                                      104
                                                                                                                  ),
                                                                                                           104
                                                                                                       )
                                                                                            )
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
                                             AND CONVERT(DATETIME, LBW_DATUM, 104) <= ISNULL(
                                                                                                DATEADD(
                                                                                                           day,
                                                                                                           ISNULL(
                                                                                                                     SKKALP_PP_TG_ABSTAND,
                                                                                                                     0
                                                                                                                 ),
                                                                                                           SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                       ),
                                                                                                CONVERT(
                                                                                                           DATETIME,
                                                                                                           convert(
                                                                                                                      varchar(10),
                                                                                                                      GETDATE(),
                                                                                                                      104
                                                                                                                  ),
                                                                                                           104
                                                                                                       )
                                                                                            )
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
                                             AND CONVERT(DATETIME, LBW_DATUM, 104) <= ISNULL(
                                                                                                DATEADD(
                                                                                                           day,
                                                                                                           ISNULL(
                                                                                                                     SKKALP_PP_TG_ABSTAND,
                                                                                                                     0
                                                                                                                 ),
                                                                                                           SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                       ),
                                                                                                CONVERT(
                                                                                                           DATETIME,
                                                                                                           convert(
                                                                                                                      varchar(10),
                                                                                                                      GETDATE(),
                                                                                                                      104
                                                                                                                  ),
                                                                                                           104
                                                                                                       )
                                                                                            )
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
                                                                                           - ISNULL(
                                                                                                       BP_LIEF_MENGE_SUMME,
                                                                                                       0
                                                                                                   ) < 0 THEN
                                                                                          0
                                                                                      ELSE
                                                                                          ISNULL(BP_MESU_FE_MENGE, 0)
                                                                                          - ISNULL(
                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                      0
                                                                                                  )
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
                                                         AND (CASE
                                                                  WHEN tBE_BELP.BP_PP_DATUM_TERMIN IS NOT NULL THEN
                                                                      tBE_BELP.BP_PP_DATUM_TERMIN
                                                                  ELSE
                                                                      CASE
                                                                          WHEN tBE_BELP.BP_LI_DATUM IS NOT NULL THEN
                                                                              tBE_BELP.BP_LI_DATUM
                                                                          ELSE
                                                                              CASE
                                                                                  WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM IS NOT NULL THEN
                                                                                      tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                                                                                  ELSE
                                                                                      CONVERT(
                                                                                                 DATETIME,
                                                                                                 convert(
                                                                                                            varchar(10),
                                                                                                            GETDATE(),
                                                                                                            104
                                                                                                        ),
                                                                                                 104
                                                                                             )
                                                                              END
                                                                      END
                                                              END <= ISNULL(
                                                                               DATEADD(
                                                                                          day,
                                                                                          ISNULL(
                                                                                                    SKKALP_PP_TG_ABSTAND,
                                                                                                    0
                                                                                                ),
                                                                                          SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                      ),
                                                                               CONVERT(
                                                                                          DATETIME,
                                                                                          convert(
                                                                                                     varchar(10),
                                                                                                     GETDATE(),
                                                                                                     104
                                                                                                 ),
                                                                                          104
                                                                                      )
                                                                           )
                                                             )
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
                                                                                           - ISNULL(
                                                                                                       BP_LIEF_MENGE_SUMME,
                                                                                                       0
                                                                                                   ) < 0 THEN
                                                                                          0
                                                                                      ELSE
                                                                                          ISNULL(BP_MESU_FE_MENGE, 0)
                                                                                          - ISNULL(
                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                      0
                                                                                                  )
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
                                                         AND (CASE
                                                                  WHEN tBE_BELP.BP_PP_DATUM_TERMIN IS NOT NULL THEN
                                                                      tBE_BELP.BP_PP_DATUM_TERMIN
                                                                  ELSE
                                                                      CASE
                                                                          WHEN tBE_BELP.BP_LI_DATUM IS NOT NULL THEN
                                                                              tBE_BELP.BP_LI_DATUM
                                                                          ELSE
                                                                              CASE
                                                                                  WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM IS NOT NULL THEN
                                                                                      tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                                                                                  ELSE
                                                                                      CONVERT(
                                                                                                 DATETIME,
                                                                                                 convert(
                                                                                                            varchar(10),
                                                                                                            GETDATE(),
                                                                                                            104
                                                                                                        ),
                                                                                                 104
                                                                                             )
                                                                              END
                                                                      END
                                                              END <= ISNULL(
                                                                               DATEADD(
                                                                                          day,
                                                                                          ISNULL(
                                                                                                    SKKALP_PP_TG_ABSTAND,
                                                                                                    0
                                                                                                ),
                                                                                          SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                      ),
                                                                               CONVERT(
                                                                                          DATETIME,
                                                                                          convert(
                                                                                                     varchar(10),
                                                                                                     GETDATE(),
                                                                                                     104
                                                                                                 ),
                                                                                          104
                                                                                      )
                                                                           )
                                                             )
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
                                                           FROM(((((((((tSK_KALP
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
                                                                                        WHEN ISNULL(
                                                                                                       tSK_KALK.KK_IDBEBP,
                                                                                                       0
                                                                                                   ) <> 0 THEN
                                                                                            ISNULL(
                                                                                                      tSK_KALK.KK_IDBEBP,
                                                                                                      0
                                                                                                  )
                                                                                        WHEN ISNULL(
                                                                                                       tSK_KALK.KK_IDBEBP_BASIS,
                                                                                                       0
                                                                                                   ) <> 0 THEN
                                                                                            ISNULL(
                                                                                                      tSK_KALK.KK_IDBEBP_BASIS,
                                                                                                      0
                                                                                                  )
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
                                                               (
                                                                   SELECT MIN(PSPP_DATUM_START) AS PPS_PROD_PLAN_START_SKP,
                                                                          PSPP_IDSKKP
                                                                   FROM tPPS_SKKALP_PLAN
                                                                   WHERE PSPP_STATUS_PLANUNG <> 1
                                                                   GROUP BY PSPP_IDSKKP
                                                               ) AS tPPS_PROD_PLAN_START_ENDE_SKP_LKZ
                                                                   ON tPPS_PROD_PLAN_START_ENDE_SKP_LKZ.PSPP_IDSKKP = tSK_KALP.ID)
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
                                                                            AND ISNULL(
                                                                                          KK_TYP_LAGER_BUCHUNG_UNTEREBENE,
                                                                                          -1
                                                                                      ) = 0
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
                                                                 AND (ISNULL(
                                                                                DATEADD(
                                                                                           day,
                                                                                           ISNULL(
                                                                                                     KP_PP_ZEIT_TAGE_DURCHLAUFZEIT,
                                                                                                     0
                                                                                                 ),
                                                                                           PPS_PROD_PLAN_START_SKP
                                                                                       ),
                                                                                CONVERT(
                                                                                           DATETIME,
                                                                                           convert(
                                                                                                      varchar(10),
                                                                                                      GETDATE(),
                                                                                                      104
                                                                                                  ),
                                                                                           104
                                                                                       )
                                                                            ) <= ISNULL(
                                                                                           DATEADD(
                                                                                                      day,
                                                                                                      ISNULL(
                                                                                                                SKKALP_PP_TG_ABSTAND,
                                                                                                                0
                                                                                                            ),
                                                                                                      SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                  ),
                                                                                           CONVERT(
                                                                                                      DATETIME,
                                                                                                      convert(
                                                                                                                 varchar(10),
                                                                                                                 GETDATE(),
                                                                                                                 104
                                                                                                             ),
                                                                                                      104
                                                                                                  )
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
                                                                                     tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME
                                                                                     * -1
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
                                                                                     tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME
                                                                                     * -1
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
                                                                         WHEN ISNULL(
                                                                                        tEK_BELP_MESU.BP_MESU_EK_AD_FAKTOR,
                                                                                        0
                                                                                    ) = 0 THEN
                                                                             0
                                                                         ELSE
                                                                             BP_LIEF_MENGE
                                                                             / tEK_BELP_MESU.BP_MESU_EK_AD_FAKTOR
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
                                             AND (CASE
                                                      WHEN tEK_BELP.BP_LI_DATUM IS NOT NULL THEN
                                                          CONVERT(DATETIME, tEK_BELP.BP_LI_DATUM, 104)
                                                      ELSE
                                                          CASE
                                                              WHEN tEK_BELK_BKBE_BE.BK_BKBE_BE_LI_DATUM IS NOT NULL THEN
                                                                  CONVERT(
                                                                             DATETIME,
                                                                             tEK_BELK_BKBE_BE.BK_BKBE_BE_LI_DATUM,
                                                                             104
                                                                         )
                                                              ELSE
                                                                  CONVERT(
                                                                             DATETIME,
                                                                             convert(varchar(10), GETDATE(), 104),
                                                                             104
                                                                         )
                                                          END
                                                  END <= ISNULL(
                                                                   DATEADD(
                                                                              day,
                                                                              ISNULL(SKKALP_PP_TG_ABSTAND, 0),
                                                                              SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                          ),
                                                                   CONVERT(
                                                                              DATETIME,
                                                                              convert(varchar(10), GETDATE(), 104),
                                                                              104
                                                                          )
                                                               )
                                                 )
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
                   WHERE tLG_KENNZ.LG_KENNZ_IDAR = KP_IDAR
               ) AS FLOAT) AS LG_BESTAND_LAGER_KÖRPERLICH,
               CAST(
               (
                   SELECT ISNULL(LG_BESTAND_LAGER_VERFÜGBAR, 0)
                   FROM
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
                                                                              ROUND(
                                                                                       ISNULL(
                                                                                                 LG_BESTAND_LAGER_KÖRPERLICH,
                                                                                                 0
                                                                                             ),
                                                                                       4
                                                                                   )
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
                                                                               ROUND(
                                                                                        ISNULL(
                                                                                                  LG_BESTAND_PRODUKTION_ZUGANG,
                                                                                                  0
                                                                                              ),
                                                                                        4
                                                                                    )
                                                                           ELSE
                                                                               0
                                                                       END,
                                      'LG_BESTAND_PRODUKTION_ABGANG' = CASE
                                                                           WHEN AR_TYP_LAGER_BUCHUNG = 1 THEN
                                                                               ROUND(
                                                                                        ISNULL(
                                                                                                  LG_BESTAND_PRODUKTION_ABGANG,
                                                                                                  0
                                                                                              ),
                                                                                        4
                                                                                    )
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
                                             AND CONVERT(DATETIME, LBW_DATUM, 104) <= ISNULL(
                                                                                                DATEADD(
                                                                                                           day,
                                                                                                           ISNULL(
                                                                                                                     SKKALP_PP_TG_ABSTAND,
                                                                                                                     0
                                                                                                                 ),
                                                                                                           SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                       ),
                                                                                                CONVERT(
                                                                                                           DATETIME,
                                                                                                           convert(
                                                                                                                      varchar(10),
                                                                                                                      GETDATE(),
                                                                                                                      104
                                                                                                                  ),
                                                                                                           104
                                                                                                       )
                                                                                            )
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
                                             AND CONVERT(DATETIME, LBW_DATUM, 104) <= ISNULL(
                                                                                                DATEADD(
                                                                                                           day,
                                                                                                           ISNULL(
                                                                                                                     SKKALP_PP_TG_ABSTAND,
                                                                                                                     0
                                                                                                                 ),
                                                                                                           SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                       ),
                                                                                                CONVERT(
                                                                                                           DATETIME,
                                                                                                           convert(
                                                                                                                      varchar(10),
                                                                                                                      GETDATE(),
                                                                                                                      104
                                                                                                                  ),
                                                                                                           104
                                                                                                       )
                                                                                            )
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
                                             AND CONVERT(DATETIME, LBW_DATUM, 104) <= ISNULL(
                                                                                                DATEADD(
                                                                                                           day,
                                                                                                           ISNULL(
                                                                                                                     SKKALP_PP_TG_ABSTAND,
                                                                                                                     0
                                                                                                                 ),
                                                                                                           SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                       ),
                                                                                                CONVERT(
                                                                                                           DATETIME,
                                                                                                           convert(
                                                                                                                      varchar(10),
                                                                                                                      GETDATE(),
                                                                                                                      104
                                                                                                                  ),
                                                                                                           104
                                                                                                       )
                                                                                            )
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
                                                                                           - ISNULL(
                                                                                                       BP_LIEF_MENGE_SUMME,
                                                                                                       0
                                                                                                   ) < 0 THEN
                                                                                          0
                                                                                      ELSE
                                                                                          ISNULL(BP_MESU_FE_MENGE, 0)
                                                                                          - ISNULL(
                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                      0
                                                                                                  )
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
                                                         AND (CASE
                                                                  WHEN tBE_BELP.BP_PP_DATUM_TERMIN IS NOT NULL THEN
                                                                      tBE_BELP.BP_PP_DATUM_TERMIN
                                                                  ELSE
                                                                      CASE
                                                                          WHEN tBE_BELP.BP_LI_DATUM IS NOT NULL THEN
                                                                              tBE_BELP.BP_LI_DATUM
                                                                          ELSE
                                                                              CASE
                                                                                  WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM IS NOT NULL THEN
                                                                                      tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                                                                                  ELSE
                                                                                      CONVERT(
                                                                                                 DATETIME,
                                                                                                 convert(
                                                                                                            varchar(10),
                                                                                                            GETDATE(),
                                                                                                            104
                                                                                                        ),
                                                                                                 104
                                                                                             )
                                                                              END
                                                                      END
                                                              END <= ISNULL(
                                                                               DATEADD(
                                                                                          day,
                                                                                          ISNULL(
                                                                                                    SKKALP_PP_TG_ABSTAND,
                                                                                                    0
                                                                                                ),
                                                                                          SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                      ),
                                                                               CONVERT(
                                                                                          DATETIME,
                                                                                          convert(
                                                                                                     varchar(10),
                                                                                                     GETDATE(),
                                                                                                     104
                                                                                                 ),
                                                                                          104
                                                                                      )
                                                                           )
                                                             )
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
                                                                                           - ISNULL(
                                                                                                       BP_LIEF_MENGE_SUMME,
                                                                                                       0
                                                                                                   ) < 0 THEN
                                                                                          0
                                                                                      ELSE
                                                                                          ISNULL(BP_MESU_FE_MENGE, 0)
                                                                                          - ISNULL(
                                                                                                      BP_LIEF_MENGE_SUMME,
                                                                                                      0
                                                                                                  )
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
                                                         AND (CASE
                                                                  WHEN tBE_BELP.BP_PP_DATUM_TERMIN IS NOT NULL THEN
                                                                      tBE_BELP.BP_PP_DATUM_TERMIN
                                                                  ELSE
                                                                      CASE
                                                                          WHEN tBE_BELP.BP_LI_DATUM IS NOT NULL THEN
                                                                              tBE_BELP.BP_LI_DATUM
                                                                          ELSE
                                                                              CASE
                                                                                  WHEN tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM IS NOT NULL THEN
                                                                                      tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                                                                                  ELSE
                                                                                      CONVERT(
                                                                                                 DATETIME,
                                                                                                 convert(
                                                                                                            varchar(10),
                                                                                                            GETDATE(),
                                                                                                            104
                                                                                                        ),
                                                                                                 104
                                                                                             )
                                                                              END
                                                                      END
                                                              END <= ISNULL(
                                                                               DATEADD(
                                                                                          day,
                                                                                          ISNULL(
                                                                                                    SKKALP_PP_TG_ABSTAND,
                                                                                                    0
                                                                                                ),
                                                                                          SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                      ),
                                                                               CONVERT(
                                                                                          DATETIME,
                                                                                          convert(
                                                                                                     varchar(10),
                                                                                                     GETDATE(),
                                                                                                     104
                                                                                                 ),
                                                                                          104
                                                                                      )
                                                                           )
                                                             )
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
                                                           FROM(((((((((tSK_KALP
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
                                                                                        WHEN ISNULL(
                                                                                                       tSK_KALK.KK_IDBEBP,
                                                                                                       0
                                                                                                   ) <> 0 THEN
                                                                                            ISNULL(
                                                                                                      tSK_KALK.KK_IDBEBP,
                                                                                                      0
                                                                                                  )
                                                                                        WHEN ISNULL(
                                                                                                       tSK_KALK.KK_IDBEBP_BASIS,
                                                                                                       0
                                                                                                   ) <> 0 THEN
                                                                                            ISNULL(
                                                                                                      tSK_KALK.KK_IDBEBP_BASIS,
                                                                                                      0
                                                                                                  )
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
                                                               (
                                                                   SELECT MIN(PSPP_DATUM_START) AS PPS_PROD_PLAN_START_SKP,
                                                                          PSPP_IDSKKP
                                                                   FROM tPPS_SKKALP_PLAN
                                                                   WHERE PSPP_STATUS_PLANUNG <> 1
                                                                   GROUP BY PSPP_IDSKKP
                                                               ) AS tPPS_PROD_PLAN_START_ENDE_SKP_LKZ
                                                                   ON tPPS_PROD_PLAN_START_ENDE_SKP_LKZ.PSPP_IDSKKP = tSK_KALP.ID)
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
                                                                            AND ISNULL(
                                                                                          KK_TYP_LAGER_BUCHUNG_UNTEREBENE,
                                                                                          -1
                                                                                      ) = 0
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
                                                                 AND (ISNULL(
                                                                                DATEADD(
                                                                                           day,
                                                                                           ISNULL(
                                                                                                     KP_PP_ZEIT_TAGE_DURCHLAUFZEIT,
                                                                                                     0
                                                                                                 ),
                                                                                           PPS_PROD_PLAN_START_SKP
                                                                                       ),
                                                                                CONVERT(
                                                                                           DATETIME,
                                                                                           convert(
                                                                                                      varchar(10),
                                                                                                      GETDATE(),
                                                                                                      104
                                                                                                  ),
                                                                                           104
                                                                                       )
                                                                            ) <= ISNULL(
                                                                                           DATEADD(
                                                                                                      day,
                                                                                                      ISNULL(
                                                                                                                SKKALP_PP_TG_ABSTAND,
                                                                                                                0
                                                                                                            ),
                                                                                                      SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                                                  ),
                                                                                           CONVERT(
                                                                                                      DATETIME,
                                                                                                      convert(
                                                                                                                 varchar(10),
                                                                                                                 GETDATE(),
                                                                                                                 104
                                                                                                             ),
                                                                                                      104
                                                                                                  )
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
                                                                                     tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME
                                                                                     * -1
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
                                                                                     tEK_BELP_LIEF.BP_LIEF_MENGE_SUMME
                                                                                     * -1
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
                                                                         WHEN ISNULL(
                                                                                        tEK_BELP_MESU.BP_MESU_EK_AD_FAKTOR,
                                                                                        0
                                                                                    ) = 0 THEN
                                                                             0
                                                                         ELSE
                                                                             BP_LIEF_MENGE
                                                                             / tEK_BELP_MESU.BP_MESU_EK_AD_FAKTOR
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
                                             AND (CASE
                                                      WHEN tEK_BELP.BP_LI_DATUM IS NOT NULL THEN
                                                          CONVERT(DATETIME, tEK_BELP.BP_LI_DATUM, 104)
                                                      ELSE
                                                          CASE
                                                              WHEN tEK_BELK_BKBE_BE.BK_BKBE_BE_LI_DATUM IS NOT NULL THEN
                                                                  CONVERT(
                                                                             DATETIME,
                                                                             tEK_BELK_BKBE_BE.BK_BKBE_BE_LI_DATUM,
                                                                             104
                                                                         )
                                                              ELSE
                                                                  CONVERT(
                                                                             DATETIME,
                                                                             convert(varchar(10), GETDATE(), 104),
                                                                             104
                                                                         )
                                                          END
                                                  END <= ISNULL(
                                                                   DATEADD(
                                                                              day,
                                                                              ISNULL(SKKALP_PP_TG_ABSTAND, 0),
                                                                              SKKALP_PPS_PROD_PLAN_DATUM_START
                                                                          ),
                                                                   CONVERT(
                                                                              DATETIME,
                                                                              convert(varchar(10), GETDATE(), 104),
                                                                              104
                                                                          )
                                                               )
                                                 )
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
                   WHERE tLG_KENNZ.LG_KENNZ_IDAR = KP_IDAR
               ) AS FLOAT) AS LG_BESTAND_LAGER_VERFÜGBAR,
               tBE_BELP.ID AS IDBEBP
        FROM
        (
            SELECT tSK_KALP.*,
                   'SKKALP_PP_DATUM_START' = KP_PP_DATUM_START,
                   'SKKALP_PP_TG_ABSTAND' = KP_PP_ZEIT_TAGE_DURCHLAUFZEIT
            FROM tSK_KALP
                LEFT JOIN
                (SELECT ID, AR_ART FROM tARST) AS tARST
                    ON tARST.ID = tSK_KALP.KP_IDAR
            WHERE AR_ART <> 3
        ) AS tSK_KALP
            LEFT JOIN tSK_KALK
                ON tSK_KALK.ID = tSK_KALP.KP_IDSKKK
            LEFT JOIN
            (
                SELECT tBE_BELP.*,
                       'BELP_DATUM_LI' = tBE_BELP.BP_LI_DATUM,
                       'BELP_DATUM_FE' = tBE_BELP.BP_PP_DATUM_TERMIN
                FROM tBE_BELP
            ) AS tBE_BELP
                ON tBE_BELP.ID = tSK_KALK.KK_IDBEBP
            LEFT JOIN
            (
                SELECT tBE_BELK_BKBE.*,
                       'BKBE_BELEG_ART' = tBE_BELK_BKBE.BK_BKBE_TYP_BELEG_ART
                FROM tBE_BELK_BKBE
            ) AS tBE_BELK_BKBE_TERMIN
                ON tBE_BELK_BKBE_TERMIN.BK_BKBE_IDBEBK = tBE_BELP.BP_IDBEBK
            LEFT JOIN
            (
                SELECT tBE_BELK_BKBE_AU.*,
                       'BKBE_DATUM_LI' = tBE_BELK_BKBE_AU.BK_BKBE_AU_LI_DATUM
                FROM tBE_BELK_BKBE_AU
            ) AS tBE_BELK_BKBE_AU
                ON tBE_BELK_BKBE_AU.BK_BKBE_AU_IDBKBE = tBE_BELK_BKBE_TERMIN.ID
            LEFT JOIN
            (
                SELECT MIN(PSPP_DATUM_START) AS SKKALP_PPS_PROD_PLAN_DATUM_START,
                       PSPP_IDSKKP
                FROM tPPS_SKKALP_PLAN
                WHERE PSPP_STATUS_PLANUNG <> 1
                GROUP BY PSPP_IDSKKP
            ) AS tPPS_PROD_PLAN_SKP
                ON tPPS_PROD_PLAN_SKP.PSPP_IDSKKP = tSK_KALP.ID
    ) AS tSK_KALP
        LEFT JOIN
        (
            SELECT tSK_KALP.ID AS IDSKKP,
                   (tSK_KALP.KP_MENGE
                    * CASE
                          WHEN tSK_KALP.KP_TYP_MENGE_BASIS = 0 THEN
                              CASE
                                  WHEN tSK_KALP.KP_HK_MENGE_BASIS = 0 THEN
                                      tBE_BELP_MESU.BP_MESU_FE_MENGE
                                  ELSE
                                      ROUND(tBE_BELP_MESU.BP_MESU_FE_MENGE * tBE_BELP_MESU.BP_MESU_GEWICHT_NETTO, 4)
                              END
                          ELSE
                              1
                      END
                   ) AS KP_MENGE_SUM,
                   KP_BEST_MENGE_SUM,
                   BP_LIEF_MENGE_SUM,
                   KP_IDAR AS IDAR_KP_SUM
            FROM
            (
                SELECT tSK_KALP.*
                FROM tSK_KALP
                    LEFT JOIN
                    (SELECT ID, AR_ART FROM tARST) AS tARST
                        ON tARST.ID = tSK_KALP.KP_IDAR
                WHERE AR_ART <> 3
            ) AS tSK_KALP
                LEFT JOIN tSK_KALK
                    ON tSK_KALK.ID = tSK_KALP.KP_IDSKKK
                LEFT JOIN tBE_BELP_MESU
                    ON tBE_BELP_MESU.BP_MESU_IDBEBP = tSK_KALK.KK_IDBEBP
                LEFT JOIN
                (
                    SELECT KP_BEST_IDSKKP,
                           SUM(KP_BEST_MENGE) AS KP_BEST_MENGE_SUM
                    FROM tSK_KALP_BEST
                    WHERE ISNULL(KP_BEST_IDEKBP_BEST, 0) > 0
                          AND KP_BEST_TYP <> 2
                    GROUP BY KP_BEST_IDSKKP
                ) AS tSK_KALP_BEST
                    ON tSK_KALP_BEST.KP_BEST_IDSKKP = tSK_KALP.ID
                LEFT JOIN
                (
                    SELECT tSK_KALP_BEST.KP_BEST_IDSKKP,
                           SUM(BP_LIEF_MENGE) AS BP_LIEF_MENGE_SUM
                    FROM tSK_KALP_BEST
                        LEFT JOIN tEK_BELP_LIEF
                            ON tEK_BELP_LIEF.BP_LIEF_IDEKBP = tSK_KALP_BEST.KP_BEST_IDEKBP_BEST
                    WHERE ISNULL(KP_BEST_IDEKBP_BEST, 0) > 0
                          AND ISNULL(tEK_BELP_LIEF.ID, 0) > 0
                          AND ISNULL(tEK_BELP_LIEF.BP_LIEF_IDEKBP_LIEF, 0) > 0
                          AND KP_BEST_TYP <> 2
                    GROUP BY KP_BEST_IDSKKP
                ) AS tEK_BELP_LIEF_SKKALP
                    ON tEK_BELP_LIEF_SKKALP.KP_BEST_IDSKKP = tSK_KALP.ID
        ) AS tKP_SUMMEN
            ON tKP_SUMMEN.IDSKKP = tSK_KALP.ID
        LEFT JOIN
        (SELECT AR_ART, AR_TYP_LAGER_BUCHUNG, ID AS IDAR FROM tARST) AS tARST
            ON tARST.IDAR = tSK_KALP.KP_IDAR
   ),
     tNF
AS (SELECT tPPS_SKKALP.ID,
           PSP_POSITION_NUMMER AS POS,
           PSK_IDBEBP AS IDBEBP,
           CASE
               WHEN EXISTS
                    (
                        SELECT ID
                        FROM tPPS_SKKALP_ZU
                        WHERE tPPS_SKKALP_ZU.PSZ_IDPSP = tPPS_SKKALP.ID
                    ) THEN
                   1
               ELSE
                   0
           END AS NF,
           (
               SELECT TOP 1
                   tPPS_SKKALP_NF.PSP_POSITION_NUMMER
               FROM tPPS_SKKALP AS tPPS_SKKALP_INNER
                   LEFT JOIN tPPS_SKKALP_ZU
                       ON tPPS_SKKALP_ZU.PSZ_IDPSP = tPPS_SKKALP_INNER.ID
                   LEFT JOIN tPPS_SKKALP AS tPPS_SKKALP_NF
                       ON tPPS_SKKALP_NF.ID = tPPS_SKKALP_ZU.PSZ_IDPSP_ZU
                   LEFT JOIN
                   (
                       SELECT ID,
                              AS_TYP_BERUECKSICHTIGUNG_KONTROLLE_FERTIGSTELLUNG
                       FROM tPPS_ARBSCHR
                   ) AS tPPS_ARBSCHR
                       ON tPPS_ARBSCHR.ID = tPPS_SKKALP.PSP_IDAS
               WHERE tPPS_SKKALP_INNER.ID = tPPS_SKKALP.ID
                     AND AS_TYP_BERUECKSICHTIGUNG_KONTROLLE_FERTIGSTELLUNG = 0
               ORDER BY tPPS_SKKALP_NF.PSP_POSITION_NUMMER DESC
           ) AS POS_NR_NF
    FROM tPPS_SKKALP
        INNER JOIN tPPS_SKKALK
            ON tPPS_SKKALK.ID = tPPS_SKKALP.PSP_IDPSKKK
        LEFT JOIN
        (
            SELECT ID,
                   AS_TYP_BERUECKSICHTIGUNG_KONTROLLE_FERTIGSTELLUNG
            FROM tPPS_ARBSCHR
        ) AS tPPS_ARBSCHR
            ON tPPS_ARBSCHR.ID = tPPS_SKKALP.PSP_IDAS
    WHERE AS_TYP_BERUECKSICHTIGUNG_KONTROLLE_FERTIGSTELLUNG = 0
    UNION ALL
    SELECT tSK_KALP.ID,
           KP_POSITION_NUMMER AS POS,
           KK_IDBEBP AS IDBEBP,
           CASE
               WHEN EXISTS
                    (
                        SELECT ID FROM tPPS_SKKALP_ZU WHERE tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP.ID
                    ) THEN
                   1
               ELSE
                   0
           END AS NF,
           (
               SELECT TOP 1
                   tPPS_SKKALP_NF.PSP_POSITION_NUMMER
               FROM
               (
                   SELECT tSK_KALP.*
                   FROM tSK_KALP
                       LEFT JOIN
                       (SELECT ID, AR_ART FROM tARST) AS tARST
                           ON tARST.ID = tSK_KALP.KP_IDAR
                   WHERE AR_ART <> 3
               ) AS tSK_KALP_INNER
                   LEFT JOIN tPPS_SKKALP_ZU
                       ON tPPS_SKKALP_ZU.PSZ_IDSKP = tSK_KALP_INNER.ID
                   LEFT JOIN tPPS_SKKALP AS tPPS_SKKALP_NF
                       ON tPPS_SKKALP_NF.ID = tPPS_SKKALP_ZU.PSZ_IDPSP_ZU
               WHERE tSK_KALP_INNER.ID = tSK_KALP.ID
               ORDER BY tPPS_SKKALP_NF.PSP_POSITION_NUMMER DESC
           ) AS POS_NR_NF
    FROM tSK_KALP
        INNER JOIN tSK_KALK
            ON tSK_KALK.ID = tSK_KALP.KP_IDSKKK
   )
SELECT ID,
       IDBEBP,
       PSP_POSITION_NUMMER,
       PSP_TYP_HERKUNFT,
       PSP_TYP_POSITION,
       KP_STATUS_BESTELLUNG_FL,
       KP_STATUS_MATERIAL,
       AS_TYP_BERUECKSICHTIGUNG_KONTROLLE_FERTIGSTELLUNG,
       CASE
           WHEN PSP_TYP_HERKUNFT = 0 THEN
               CASE
                   WHEN PSP_PP_STATUS_PRODUKTION = 0 THEN
                       CASE
                           WHEN ZE_BUCH_SUMME_ZEIT_IST > 0 THEN
                               2
                           ELSE
                               1
                       END
                   ELSE
                       4
               END
           WHEN PSP_TYP_HERKUNFT = 1 THEN
               CASE
                   WHEN EXISTS
                        (
                            SELECT * FROM tSK_KALP_LGBEWE WHERE KPLG_IDSKKP = TEMP.ID
                        ) THEN
                       4
                   ELSE
                       CASE
                           WHEN PSP_TYP_POSITION = 0 THEN
                               KP_STATUS_MATERIAL
                           ELSE
                               KP_STATUS_BESTELLUNG_FL
                       END
               END
           ELSE
               0
       END AS SPKO,
       VORGAENGER
FROM
(
    SELECT CAST(tPPS_SKKALP.ID AS INT) AS ID,
           CAST(PSP_IDPSKKK AS INT) AS PSP_IDPSKKK,
           0 AS PSP_IDSKKK,
           CAST(PSP_TYP_POSITION AS INT) AS PSP_TYP_POSITION,
           CAST(PSP_POSITION_NUMMER AS VARCHAR(1000)) AS PSP_POSITION_NUMMER,
           CAST(PSP_PP_STATUS_PRODUKTION AS INT) AS PSP_PP_STATUS_PRODUKTION,
           CAST(ISNULL(ZE_BUCH_SUMME_ZEIT_IST, 0) AS FLOAT) AS ZE_BUCH_SUMME_ZEIT_IST,
           0 AS PSP_TYP_HERKUNFT,
           0 AS KP_STATUS_BESTELLUNG_FL,
           0 AS KP_STATUS_MATERIAL,
           AS_TYP_BERUECKSICHTIGUNG_KONTROLLE_FERTIGSTELLUNG,
           ISNULL(tVORGAENGER.VORGAENGER, '') AS VORGAENGER,
           CAST(PSK_IDBEBP AS INT) AS IDBEBP
    FROM tPPS_SKKALP
        LEFT JOIN
        (
            SELECT tZE_BUCH.ZBU_IDPSKP,
                   SUM(ISNULL(ZBUBW_ZEIT, 0)) AS ZE_BUCH_SUMME_ZEIT_IST
            FROM tZE_BUCH
                LEFT JOIN
                (
                    SELECT CASE
                               WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0
                                    AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) <> 0 THEN
                                   ROUND(
                                            CAST(DATEDIFF(ss, ZBUBW_DATUM_ZEIT_START, ZBUBW_DATUM_ZEIT_STOP) AS FLOAT)
                                            / 60,
                                            4
                                        )
                               ELSE
                                   0
                           END AS ZBUBW_ZEIT,
                           tZE_BUCH_BEWE.ZBUBW_IDZBU,
                           tZE_BUCH_BEWE.ZBUBW_TYP_ZEIT,
                           tZE_BUCH_BEWE.ZBUBW_TYP_PRODUKTION
                    FROM tZE_BUCH_BEWE
                ) AS tZE_BUCH_BEWE
                    ON tZE_BUCH_BEWE.ZBUBW_IDZBU = tZE_BUCH.ID
            GROUP BY tZE_BUCH.ZBU_IDPSKP
        ) AS tZE_BUCH
            ON tZE_BUCH.ZBU_IDPSKP = tPPS_SKKALP.ID
        LEFT JOIN tPPS_SKKALK
            ON tPPS_SKKALK.ID = tPPS_SKKALP.PSP_IDPSKKK
        LEFT JOIN tPPS_ARBSCHR
            ON tPPS_ARBSCHR.ID = tPPS_SKKALP.PSP_IDAS
        LEFT JOIN
        (
            SELECT ID,
                   IDBEBP,
                   POS,
                   REPLACE(REPLACE(STUFF(
                                   (
                                       SELECT *
                                       FROM
                                       (
                                           SELECT TOP 1
                                               '|' + POS AS POS
                                           FROM tNF
                                           WHERE IDBEBP = tNF_OUTER.IDBEBP
                                                 AND POS < tNF_OUTER.POS
                                                 AND (
                                                         ISNULL(POS_NR_NF, 0) = tNF_OUTER.POS
                                                         OR ISNULL(POS_NR_NF, -999) = -999
                                                     )
                                           GROUP BY POS
                                           ORDER BY POS DESC
                                           UNION
                                           SELECT TOP 1000
                                               '|' + POS AS POS
                                           FROM tNF
                                           WHERE IDBEBP = tNF_OUTER.IDBEBP
                                                 AND POS < tNF_OUTER.POS
                                                 AND (ISNULL(POS_NR_NF, 0) = tNF_OUTER.POS)
                                           GROUP BY POS
                                           ORDER BY POS DESC
                                       ) AS T
                                       FOR XML PATH('')
                                   ),
                                   1,
                                   0,
                                   ''
                                        ),
                                   '<POS>',
                                   ''
                                  ),
                           '</POS>',
                           ''
                          ) AS VORGAENGER
            FROM tNF AS tNF_OUTER
            GROUP BY tNF_OUTER.ID,
                     tNF_OUTER.IDBEBP,
                     tNF_OUTER.POS
        ) AS tVORGAENGER
            ON tVORGAENGER.ID = tPPS_SKKALP.ID
    WHERE PSP_TYP_LAYOUT_POSITION = 0
    UNION ALL
    UNION ALL
    SELECT ID,
           PSP_IDPSKKK,
           PSP_IDSKKK,
           PSP_TYP_POSITION,
           PSP_POSITION_NUMMER,
           PSP_PP_STATUS_PRODUKTION,
           ZE_BUCH_SUMME_ZEIT_IST,
           PSP_TYP_HERKUNFT,
           KP_STATUS_BESTELLUNG_FL,
           KP_STATUS_MATERIAL,
           0 AS AS_TYP_BERUECKSICHTIGUNG_KONTROLLE_FERTIGSTELLUNG,
           '' AS VORGAENGER,
           IDBEBP
    FROM TABLE_SKKALP
) AS TEMP
WHERE ISNULL(IDBEBP, 0) <> 0
      AND ISNULL(IDBEBP, 0) IN ( 111685, 102345, 103245, 100339, 102355, 100771, 106935, 101800, 93499, 102356, 111702,
                                 100793, 103954, 100338, 101390, 102363, 108955, 100128, 101686, 103776, 102364,
                                 100115, 110985, 102346, 110598, 110758, 111238, 111242, 111591, 111240, 107126,
                                 111497, 100204, 111495, 111473, 111694, 111695, 111696, 111697, 111698, 111699,
                                 111686, 111693, 111687, 111688, 111689, 111690, 111691, 111692, 100117, 102347,
                                 102333, 100331, 111575, 102365, 106936, 102357, 109419, 108213, 111577, 103956,
                                 111579, 103958, 111581, 111583
                               )
ORDER BY IDBEBP,
         PSP_POSITION_NUMMER DESC
go