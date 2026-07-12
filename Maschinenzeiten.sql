SELECT 'MS_BEZEICHNUNG' = CONVERT(   varchar(1000),
                                     CASE
                                         WHEN ISNULL(ZBU_IDMSP, 0) <> 0 THEN
                                             '(' + MSP_NUMMER + ') '
                                         ELSE
                                             ''
                                     END + MS_BEZEICHNUNG
                                 ),
       AR_NUMMER,
       CONVERT(datetime, CONVERT(varchar, ZBUBW_DATUM_ZEIT_START, 104), 104) AS ZB_DATUM_START,
       BK_BKBE_NUMMER,
       CONVERT(VARCHAR(8), ZBUBW_DATUM_ZEIT_START, 108) AS ZBUBW_ZEIT_START,
       CONVERT(VARCHAR(8), ZBUBW_DATUM_ZEIT_STOP, 108) AS ZBUBW_ZEIT_STOP,
       ZBU_ZEIT_RUESTUNG_GESAMT,
       ZBU_ZEIT_PRODUKTION_AK,
       ZBU_ZEIT_PRODUKTION_MS,
       ZBU_ZEIT_PRODUKTION_GESAMT,
       ISNULL(ZBU_ZEIT_RUESTUNG_GESAMT, 0) + ISNULL(ZBU_ZEIT_PRODUKTION_GESAMT, 0) AS ZBU_ZEIT_GESAMT,
       BP_POSITION_NUMMER,
       PSP_POSITION_NUMMER,
       AS_NUMMER,
       AS_BEZEICHNUNG,
       ISNULL(tPPS_SKKALP.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL, 0) AS SOLL_ZEIT_RUESTUNG,
       ISNULL(tPPS_SKKALP.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL, 0) AS SOLL_ZEIT_PRODUKTION,
       MA_NUMMER,
       tADRS.AD_NAME1 AS AD_NAME1,
       ZBUBW_TYP_PRODUKTION,
       ZBU_BEMERKUNG,
       AD_BEZEICHNUNG,
       tKUND.KU_NUMMER AS ZBU_KU_NUMMER,
       tADRS_KUND.AD_NAME1 AS ZBU_KU_NAME,
       ROUND(
                (ISNULL(ZBU_ZEIT_PRODUKTION_GESAMT, 0)
                 * ISNULL(
                             CASE
                                 WHEN ISNULL(ZBU_IDMS, 0) <> 0
                                      AND ISNULL(ZBU_IDMS, 0) <> ISNULL(PSP_IDMS, 0)
                                      AND PSP_TYP_POSITION = 0
                                      AND ISNULL(tPPS_MASTA_KOSTEN.MASTA_KOSTEN_MS_TYP_KOSTENSAETZE, 0) = 1 THEN
                                     CASE
                                         WHEN ISNULL(tPPS_MASTA_KOSTEN.MASTA_KOSTEN_MS_KOSTEN_PM, 0) <> 0 THEN
                                             tPPS_MASTA_KOSTEN.MASTA_KOSTEN_MS_KOSTEN_PM
                                         ELSE
                                             CASE
                                                 WHEN ISNULL(tPPS_MASTA_KOSTEN.MASTA_KOSTEN_MS_KOSTEN_PA, 0) <> 0 THEN
                                                     tPPS_MASTA_KOSTEN.MASTA_KOSTEN_MS_KOSTEN_PA
                                                 ELSE
                                                     CASE
                                                         WHEN ISNULL(tPPS_MASTA_KOSTEN.MASTA_KOSTEN_MS_KOSTEN, 0) <> 0 THEN
                                                             tPPS_MASTA_KOSTEN.MASTA_KOSTEN_MS_KOSTEN
                                                         ELSE
                                                             0
                                                     END
                                             END
                                     END
                                 ELSE
                                     CASE
                                         WHEN ISNULL(tPPS_SKKALP.PSP_PREIS_HK_MIN_SATZ_FK_EK_EP_PRODUKTION_MS, 0) <> 0 THEN
                                             tPPS_SKKALP.PSP_PREIS_HK_MIN_SATZ_FK_EK_EP_PRODUKTION_MS
                                         ELSE
                                             CASE
                                                 WHEN ISNULL(
                                                                tPPS_SKKALP.PSP_PREIS_HK_MIN_SATZ_FK_EK_EP_PRODUKTION_AK,
                                                                0
                                                            ) <> 0 THEN
                                                     tPPS_SKKALP.PSP_PREIS_HK_MIN_SATZ_FK_EK_EP_PRODUKTION_AK
                                                 ELSE
                                                     CASE
                                                         WHEN ISNULL(tPPS_SKKALP.PSP_PREIS_HK_MIN_SATZ_FK_EK_EP, 0) <> 0 THEN
                                                             tPPS_SKKALP.PSP_PREIS_HK_MIN_SATZ_FK_EK_EP
                                                         ELSE
                                                             0
                                                     END
                                             END
                                     END
                             END,
                             0
                         )
                ),
                4
            ) AS ZBU_KOSTEN_MASCHINE_IST,
       ZBUBW_TYP_ZEIT,
       ZBUBW_TYP_PRODUKTION AS D4IV_ZBUBW_TYP_PRODUKTION,
       tZE_BUCH.ID,
       tZE_BUCH.ZBU_IDBEBP AS OrderId
FROM((((((((((((((((((((
(
    SELECT *
    FROM(((tZE_BUCH
        LEFT JOIN
        (
            SELECT ZBUBW_IDZBU AS ZBUBW_IDZBU_RUESTUNG,
                   SUM(ZBUBW_ZEIT_RUESTUNG) AS ZBU_ZEIT_RUESTUNG_GESAMT
            FROM
            (
                SELECT *,
                       'ZBUBW_ZEIT_RUESTUNG' = CASE
                                                   WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0
                                                        AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) <> 0 THEN
                                                       CASE
                                                           WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                                               ROUND(
                                                                        CAST(DATEDIFF(
                                                                                         ss,
                                                                                         ZBUBW_DATUM_ZEIT_START,
                                                                                         ZBUBW_DATUM_ZEIT_STOP
                                                                                     ) AS FLOAT) / 60,
                                                                        4
                                                                    )
                                                           ELSE
                                                               ROUND(
                                                                        CAST(DATEDIFF(
                                                                                         mi,
                                                                                         ZBUBW_DATUM_ZEIT_START,
                                                                                         ZBUBW_DATUM_ZEIT_STOP
                                                                                     ) AS FLOAT),
                                                                        4
                                                                    )
                                                       END
                                                   ELSE
                                                       0
                                               END
                FROM tZE_BUCH_BEWE
                WHERE ZBUBW_TYP_ZEIT = 0
            ) AS MATRIX1
            GROUP BY ZBUBW_IDZBU
        ) AS tZE_BUCH_BEWE_RUESTUNG
            ON tZE_BUCH_BEWE_RUESTUNG.ZBUBW_IDZBU_RUESTUNG = tZE_BUCH.ID)
        LEFT JOIN
        (
            SELECT ZBUBW_IDZBU AS ZBUBW_IDZBU_PRODUKTION,
                   SUM(ZBUBW_ZEIT_PRODUKTION) AS ZBU_ZEIT_PRODUKTION_GESAMT,
                   SUM(   CASE
                              WHEN ZBUBW_TYP_PRODUKTION = 0 THEN
                                  ZBUBW_ZEIT_PRODUKTION
                              ELSE
                                  0
                          END
                      ) AS ZBU_ZEIT_PRODUKTION_AK,
                   SUM(   CASE
                              WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                  ZBUBW_ZEIT_PRODUKTION
                              ELSE
                                  0
                          END
                      ) AS ZBU_ZEIT_PRODUKTION_MS
            FROM
            (
                SELECT *,
                       'ZBUBW_ZEIT_PRODUKTION' = CASE
                                                     WHEN ISNULL(ZBUBW_DATUM_ZEIT_START, 0) <> 0
                                                          AND ISNULL(ZBUBW_DATUM_ZEIT_STOP, 0) <> 0 THEN
                                                         CASE
                                                             WHEN ZBUBW_TYP_PRODUKTION = 1 THEN
                                                                 ROUND(
                                                                          CAST(DATEDIFF(
                                                                                           ss,
                                                                                           ZBUBW_DATUM_ZEIT_START,
                                                                                           ZBUBW_DATUM_ZEIT_STOP
                                                                                       ) AS FLOAT) / 60,
                                                                          4
                                                                      )
                                                             ELSE
                                                                 ROUND(
                                                                          CAST(DATEDIFF(
                                                                                           mi,
                                                                                           ZBUBW_DATUM_ZEIT_START,
                                                                                           ZBUBW_DATUM_ZEIT_STOP
                                                                                       ) AS FLOAT),
                                                                          4
                                                                      )
                                                         END
                                                     ELSE
                                                         0
                                                 END
                FROM tZE_BUCH_BEWE
                WHERE ZBUBW_TYP_ZEIT = 1
            ) AS MATRIX2
            GROUP BY ZBUBW_IDZBU
        ) AS tZE_BUCH_BEWE_PRODUKTION
            ON tZE_BUCH_BEWE_PRODUKTION.ZBUBW_IDZBU_PRODUKTION = tZE_BUCH.ID)
        LEFT JOIN
        (
            SELECT ID AS IDZBU_MENGE_IST,
                   ISNULL(ZBU_MENGE_IST, 0) AS MENGE_IST
            FROM tZE_BUCH
        ) AS tZE_BUCH_MENGE_IST
            ON tZE_BUCH_MENGE_IST.IDZBU_MENGE_IST = tZE_BUCH.ID)
) AS tZE_BUCH
    LEFT JOIN tZE_BEWE
        ON tZE_BUCH.ZBU_IDZB = tZE_BEWE.ID)
    LEFT JOIN tMARB
        ON tZE_BEWE.ZB_IDMR = tMARB.ID)
    LEFT JOIN tZE_STAR
        ON tZE_BUCH.ZBU_IDZS = tZE_STAR.ID)
    LEFT JOIN tKAGO
        ON tKAGO.ID = tZE_BUCH.ZBU_IDKAGO_AUSSCHUSS)
    LEFT JOIN tZE_BUCH_BEWE
        ON tZE_BUCH_BEWE.ZBUBW_IDZBU = tZE_BUCH.ID)
    LEFT JOIN tBE_BELK_BKBE
        ON tZE_BUCH.ZBU_IDBEBK = tBE_BELK_BKBE.BK_BKBE_IDBEBK)
    LEFT JOIN tBE_BELP
        ON tZE_BUCH.ZBU_IDBEBP = tBE_BELP.ID)
    LEFT JOIN tARST
        ON tARST.ID = tBE_BELP.BP_IDAR)
    LEFT JOIN tPPS_SKKALP
        ON tPPS_SKKALP.ID = tZE_BUCH.ZBU_IDPSKP)
    LEFT JOIN tBE_BELK_ALLG
        ON tZE_BUCH.ZBU_IDBEBK = tBE_BELK_ALLG.BK_ALLG_IDBEBK)
    LEFT JOIN tPPS_ARBSCHR
        ON tPPS_ARBSCHR.ID = tPPS_SKKALP.PSP_IDAS)
    LEFT JOIN tARDI
        ON tARDI.ID = tBE_BELP.BP_FE_IDAD)
    LEFT JOIN tKUND
        ON tKUND.ID = tBE_BELK_BKBE.BK_BKBE_IDKU_RE)
    LEFT JOIN tADRS AS tADRS_KUND
        ON tADRS_KUND.ID = tKUND.KU_IDAD)
    LEFT JOIN tZE_BUCH_PR
        ON tZE_BUCH_PR.ID = tZE_BUCH.ZBU_IDZBUPR)
    LEFT JOIN tPPS_MASTA
        ON tPPS_MASTA.ID = tZE_BUCH.ZBU_IDMS)
    LEFT JOIN tPPS_MASTA_PALETTEN
        ON tPPS_MASTA_PALETTEN.ID = tZE_BUCH.ZBU_IDMSP)
    LEFT JOIN tADRS
        ON tMARB.MA_IDAD = tADRS.ID)
    LEFT JOIN
    (
        SELECT AKB_IDPSKP,
               AKB_IDMS,
               MAX(ID) AS AKB_ID
        FROM tANSP_KOMM_BEN
        GROUP BY AKB_IDPSKP,
                 AKB_IDMS
    ) AS AKB_MAX
        ON AKB_MAX.AKB_IDPSKP = tPPS_SKKALP.ID
           AND AKB_MAX.AKB_IDMS = tPPS_MASTA.ID)
    LEFT JOIN
    (
        SELECT ID AS MASTA_KOSTEN_ID,
               MS_TYP_KOSTENSAETZE AS MASTA_KOSTEN_MS_TYP_KOSTENSAETZE,
               MS_KOSTEN_PM AS MASTA_KOSTEN_MS_KOSTEN_PM,
               MS_KOSTEN_PA AS MASTA_KOSTEN_MS_KOSTEN_PA,
               MS_KOSTEN AS MASTA_KOSTEN_MS_KOSTEN
        FROM tPPS_MASTA
    ) AS tPPS_MASTA_KOSTEN
        ON tPPS_MASTA_KOSTEN.MASTA_KOSTEN_ID = tZE_BUCH.ZBU_IDMS)
WHERE CONVERT(DATETIME, tZE_BUCH_BEWE.ZBUBW_DATUM_ZEIT_START, 104) >= '08.07.2026'
      AND CONVERT(DATETIME, tZE_BUCH_BEWE.ZBUBW_DATUM_ZEIT_STOP, 104) <= '08.07.2026 23:59:59'
ORDER BY CAST(MS_BEZEICHNUNG AS VARCHAR(4000)),
         AR_NUMMER,
         ZB_DATUM_START ASC
go