<script lang="ts">
  import { page } from '$app/state'
  import * as Tooltip from '$lib/components/ui/tooltip/index.js'
  import { ChartLine } from '@lucide/svelte'
  import type { PageProps } from './$types'

  const { data }: PageProps = $props()
  const countsByAssessmentMethod = $derived(data.countsByAssessmentMethod)

  const assessmentMethodLinks = [
    { id: 'written-exam', title: 'Klausurarbeiten' },
    { id: 'e-exam', title: 'E-Prüfung' },
    {
      id: 'written-exam-answer-choice-method',
      title: 'Schriftliche Prüfungen im Antwortwahlverfahren'
    },
    { id: 'oral-exam', title: 'Mündliche Prüfungen' },
    { id: 'home-assignment', title: 'Hausarbeit' },
    { id: 'open-book-exam', title: 'Open-Book-Ausarbeitung' },
    { id: 'oral-contribution', title: 'Mündlicher Beitrag' },
    { id: 'project', title: 'Projektarbeit' },
    { id: 'certificate-achievement', title: 'Testat' },
    { id: 'performance-assessment', title: 'Performanzprüfung' },
    { id: 'portfolio', title: 'Lernportfolio' },
    { id: 'practical-report', title: 'Praktikumsbericht' },
    { id: 'role-play', title: 'Rollenspiel' },
    { id: 'admission-colloquium', title: 'Zugangskolloquium' },
    { id: 'specimen', title: 'Präparat' }
  ]

  function modulesCount(assessmentMethodId: string) {
    return countsByAssessmentMethod[assessmentMethodId] ?? 0
  }

  const totalModulesAcrossAssessmentMethods = $derived(
    assessmentMethodLinks.reduce((sum, method) => sum + modulesCount(method.id), 0)
  )

  function modulesCountLabel(assessmentMethodId: string) {
    const modulesCountForMethod = modulesCount(assessmentMethodId)
    const moduleSuffix = modulesCountForMethod === 1 ? '' : 'e'
    return `${modulesCountForMethod} Modul${moduleSuffix}`
  }

  function modulesUsageTooltip(assessmentMethodId: string) {
    const modulesCountForMethod = modulesCount(assessmentMethodId)
    if (modulesCountForMethod === 0) {
      return 'Keine Module nutzen diese Prüfungsform'
    }

    const usagePercent =
      totalModulesAcrossAssessmentMethods === 0
        ? 0
        : (modulesCountForMethod / totalModulesAcrossAssessmentMethods) * 100

    const usagePercentLabel =
      usagePercent > 0 && usagePercent < 1 ? '<1' : `${Math.round(usagePercent)}`
    const moduleSuffix = modulesCountForMethod === 1 ? '' : 'e'
    const verb = modulesCountForMethod === 1 ? 'verwendet' : 'verwenden'

    return `${modulesCountForMethod} Modul${moduleSuffix} ${verb} diese Prüfungsform (${usagePercentLabel} %)`
  }

  let activeSelection = $state('')

  $effect(() => {
    const hash = page.url.hash
    if (hash) {
      activeSelection = hash.slice(1)
    }
  })

  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId)
    if (!element) return

    history.pushState(null, '', `#${sectionId}`)
    activeSelection = sectionId
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
</script>

{#snippet assessmentMethodMeta(assessmentMethodId: string)}
  <p class="not-prose border-border/40 mt-2 border-t pt-2">
    <Tooltip.Root>
      <Tooltip.Trigger>
        <span
          class="text-muted-foreground inline-flex cursor-help items-center gap-1.5 text-[11px] tracking-[0.01em] transition-opacity hover:opacity-90"
          title={modulesUsageTooltip(assessmentMethodId)}
        >
          <ChartLine class="size-3.5" />
          {modulesCountLabel(assessmentMethodId)}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content class="max-w-sm">
        {modulesUsageTooltip(assessmentMethodId)}
      </Tooltip.Content>
    </Tooltip.Root>
  </p>
{/snippet}

<div class="w-full max-w-none space-y-8">
  <div class="flex gap-8">
    <main class="min-w-0 flex-1 space-y-8">
      <header class="space-y-2">
        <h2 class="text-3xl font-bold tracking-tight">Prüfungsformen</h2>
        <p class="text-muted-foreground text-sm">
          Zulässige Prüfungsformen für Module am Campus Gummersbach. Die verbindliche Quelle ist die
          <a
            href="https://www.th-koeln.de/mam/downloads/deutsch/hochschule/organisation/leitung/endfassung_67.pdf"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline hover:no-underline"
          >
            offizielle Prüfungsordnung
          </a> (Stand November 2021).
        </p>
      </header>

      <Tooltip.Provider>
        <section class="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <div id="written-exam" class="scroll-mt-24 space-y-3">
            <h3>§ 19 Klausurarbeiten</h3>
            <p>
              (1) In den Klausurarbeiten soll die oder der Studierende nachweisen, dass sie oder er
              in begrenzter Zeit und mit beschränkten Hilfsmitteln Themen oder Fragestellungen aus
              Gebieten des jeweiligen Moduls mit geläufigen wissenschaftlichen Methoden ihrer oder
              seiner Fachrichtung erkennt und auf richtigem Wege zu einer Lösung finden kann.
            </p>
            <p>
              (2) Eine Klausurarbeit findet unter Aufsicht statt. Über die Zulassung von
              Hilfsmitteln entscheidet die Prüferin oder der Prüfer.
            </p>
            <p>
              (3) Die Klausurarbeit wird in der Regel von nur einer Prüferin oder einem Prüfer
              gestellt. In fachlich begründeten Fällen, insbesondere, wenn in einem Modul mehrere
              Fachgebiete zusammenfassend geprüft werden, kann die Prüfungsaufgabe auch von mehreren
              Prüferinnen oder Prüfern gestellt werden. In diesem Fall legen die Prüferinnen oder
              Prüfer die Gewichtung der Anteile an der Prüfungsaufgabe vorher gemeinsam fest;
              ungeachtet der Anteile und ihrer Gewichtung beurteilt jede Prüferin oder jeder Prüfer
              die gesamte Klausurarbeit. Abweichend davon kann der Prüfungsausschuss wegen der
              Besonderheit eines Fachgebietes bestimmen, dass die Prüferin oder der Prüfer nur den
              Teil der Klausurarbeit beurteilt, der ihrem oder seinem Fachgebiet entspricht. In
              diesem Fall wird die Bewertung entsprechend der vorher festgelegten Gewichtung der
              Anteile berücksichtigt. § 18 Abs. 5 bleibt unberührt.
            </p>
            {@render assessmentMethodMeta('written-exam')}
          </div>

          <div id="e-exam" class="scroll-mt-24 space-y-3">
            <h3>§ 19 E-Prüfung</h3>
            <p>
              (4) In elektronischer Form durchgeführte Prüfungen sind zulässig. Sie werden wie
              schriftliche Prüfungen behandelt. Eine elektronische Klausur (eKlausur) ist eine
              Prüfung, die am Computer durchgeführt und deren Erstellung, Durchführung und
              Auswertung insgesamt durch Informations- und Kommunikationstechnologien unterstützt
              wird. Den Studierenden wird vor der Prüfung ausreichend Gelegenheit gegeben, sich mit
              dem elektronischen Prüfungssystem vertraut zu machen. Die eKlausur ist in Anwesenheit
              (bei Präsenzprüfung) oder Erreichbarkeit (bei Fernprüfung) einer fachlich sachkundigen
              Person durchzuführen, die über den Prüfungsverlauf eine Niederschrift anfertigt (§ 18
              Abs. 6). Es muss sichergestellt sein, dass die elektronischen Daten eindeutig und bis
              zum Ablauf der Aufbewahrungsfristen den einzelnen Prüfungskandidatinnen und
              Prüfungskandidaten zugeordnet werden können.
            </p>
            <p>
              (5) Die elektronische Fernklausur ist auf begründeten Antrag der oder des Prüfenden
              und mit Zustimmung des Prüfungsausschusses zulässig. Die Prüflinge müssen sich zu
              Beginn der Prüfung mittels MultiCa und Personalausweis/Pass ausweisen und per
              Kameraschwenk durch den Raum, in welchem sie die Prüfung anfertigen, zeigen, dass sie
              sich alleine dort aufhalten und die Prüfung ohne nicht zugelassene Hilfsmittel
              bearbeiten. Um die Chancengleichheit zu gewährleisten und dazu Täuschungshandlungen
              während einer Fernklausur zu unterbinden, sind die Studierenden verpflichtet, die
              Kamera- und Mikrofonfunktion der zur Prüfung eingesetzten Kommunikationseinrichtungen
              zu aktivieren (Videoaufsicht). Im Verdachtsfall kann ein weiterer Kameraschwenk
              verlangt werden. Die Videoaufsicht ist im Übrigen so zu gestalten, dass der
              Persönlichkeitsschutz und die Privatsphäre der Prüflinge nicht mehr als zu den
              berechtigten Kontrollzwecken erforderlich eingeschränkt werden. Die Videoaufsicht
              erfolgt durch Aufsichtspersonal der Hochschule. Eine automatisierte Auswertung von
              Bild- oder Tondaten der Videoaufsicht findet grundsätzlich nicht statt. Eine
              Aufzeichnung der Prüfung oder anderweitige Speicherung der Bild- oder Tondaten findet
              nicht statt.
            </p>
            <p>
              In begründeten Einzelfällen können Studierende bei elektronischen Fernklausuren beim
              Prüfungsausschuss einen Antrag stellen, dass die Prüfungsleistung ausnahmsweise in
              Präsenz an der Hochschule abgelegt werden kann. Eine Ablehnung des Antrags muss
              seitens des Prüfungsausschusses begründet werden.
            </p>
            {@render assessmentMethodMeta('e-exam')}
          </div>

          <div id="written-exam-answer-choice-method" class="scroll-mt-24 space-y-3">
            <h3>§ 20 Schriftliche Prüfungen im Antwortwahlverfahren</h3>
            <p>
              (1) Klausurarbeiten können ganz oder teilweise auch in der Form des
              Antwortwahlverfahrens durchgeführt werden. Hierbei haben die Studierenden unter
              Aufsicht schriftlich gestellte Fragen durch die Angabe der für zutreffend befundenen
              Antworten aus einem Katalog vorgegebener Antwortmöglichkeiten zu lösen. Das
              Antwortwahlverfahren kommt in dazu geeigneten Modulen auf Antrag der Prüfenden und mit
              Zustimmung des Prüfungsausschusses zur Anwendung.
            </p>
            <p>
              (2) Die Prüfungsfragen müssen auf die mit dem betreffenden Modul zu vermittelnden
              Kenntnisse und Qualifikationen abgestellt sein und zuverlässige Prüfungsergebnisse
              ermöglichen.
            </p>
            <p>
              (3) Bei Übereinstimmung zwischen festgelegter und tatsächlicher Antwort wird – ggf.
              gewichtet – gewertet. Besteht keine Übereinstimmung zwischen festgelegter und
              tatsächlicher Antwort, so wird kein Bewertungspunkt vergeben; ein Punktabzug findet
              nicht statt. Es werden ebenfalls keine Bewertungspunkte vergeben, wenn keine der
              Antworten gewählt wurde, auch wenn dabei nicht zutreffende Antworten korrekt nicht
              markiert worden sind, und wenn alle Antworten markiert wurden, auch wenn dabei
              zutreffende Antworten korrekt markiert wurden, es sei denn, dass alle
              Antwortmöglichkeiten anzukreuzen sind oder keine. Enthält die Aufgabenstellung einen
              Hinweis darauf, wie viele der vorgegebenen Antworten zutreffen, werden ebenfalls keine
              Bewertungspunkte vergeben, wenn insgesamt mehr Antworten als die festgelegte Anzahl
              markiert wurden.
            </p>
            <p>(4) Die Bewertung der schriftlichen Prüfung hat folgende Angaben zu enthalten:</p>
            <ul class="list-inside list-none">
              <li>
                a) Die Zahl der gestellten und die Zahl der vom Prüfling zutreffend beantworteten
                Prüfungsfragen,
              </li>
              <li>
                b) die erforderliche Mindestpunktzahl zutreffend zu beantwortender Prüfungsfragen
                (Bestehensgrenze),
              </li>
              <li>
                c) im Falle des Bestehens die Prozentzahl, um die die Anzahl der zutreffend
                beantworteten Fragen die Mindestanforderungen übersteigt,
              </li>
              <li>d) die von der oder dem Studierenden erzielte Note.</li>
            </ul>
            <p>
              (5) Die Prüfenden haben bei der Auswertung der Prüfungsleistungen aller Studierenden
              darauf zu achten, ob sich aufgrund der Häufung fehlerhafter Antworten auf bestimmte
              Prüfungsfragen Anhaltspunkte dafür ergeben, dass die Prüfungsaufgabe fehlerhaft
              formuliert war. Ergibt sich nach der Durchführung der Prüfung, dass einzelne
              Prüfungsfragen oder Antwortmöglichkeiten fehlerhaft sind, gelten die betreffenden
              Prüfungsaufgaben als nicht gestellt. Die Zahl der Prüfungsaufgaben vermindert sich
              entsprechend, bei der Bewertung ist die verminderte Aufgabenzahl zugrunde zu legen.
              Die Verminderung der Prüfungsaufgaben darf sich nicht zum Nachteil der Studierenden
              auswirken.
            </p>
            <p>
              (6) Besteht eine Prüfungsleistung nur teilweise aus Prüfungsaufgaben im
              Antwort-Wahl-Verfahren, gelten die Absätze 1 bis 5 nur für den im
              Antwort-Wahl-Verfahren erstellten Prüfungsteil. Handelt es sich im Falle des Satzes 1
              um einen unselbständigen Prüfungsteil, finden die Bestimmungen des Absatzes 4
              Buchstaben b) bis d) keine Anwendung.
            </p>
            {@render assessmentMethodMeta('written-exam-answer-choice-method')}
          </div>

          <div id="oral-exam" class="scroll-mt-24 space-y-3">
            <h3>§ 21 Mündliche Prüfungen</h3>
            <p>
              (1) Mündliche Prüfungen werden, außer in Fällen des § 18 Abs. 5, vor einer Prüferin
              oder einem Prüfer in Gegenwart einer sachkundigen Beisitzerin oder eines sachkundigen
              Beisitzers (§ 9 Abs. 1) oder vor mehreren Prüferinnen oder Prüfern (Kollegialprüfung)
              als Gruppenprüfungen oder als Einzelprüfungen abgelegt. Werden in einer Prüfung
              mehrere Fachgebiete gemeinsam geprüft, wird die oder der einzelne Studierende in jedem
              Fachgebiet grundsätzlich nur von einer Prüferin oder einem Prüfer geprüft, es sei
              denn, es liegt ein Fall des § 18 Abs. 5 vor. Vor der Festsetzung der Note hat die
              Prüferin oder der Prüfer die Beisitzerin oder den Beisitzer oder die anderen
              Prüferinnen oder Prüfer zu hören. Mündliche Prüfungen können auch mit Hilfe
              elektronischer Kommunikation durchgeführt werden.
            </p>
            <p>
              (2) Die wesentlichen Gegenstände und Ergebnisse der Prüfung, insbesondere die für die
              Benotung maßgeblichen Tatsachen, sind in einem Protokoll festzuhalten. Die Note ist
              den Studierenden im Anschluss an die Prüfung bekanntzugeben.
            </p>
            <p>
              (3) Studierenden des gleichen Studiengangs bzw. desselben Moduls, die sich in einem
              späteren Prüfungszeitraum bzw. Prüfungstermin der gleichen Prüfung unterziehen wollen,
              soll bei mündlichen Prüfungen die Teilnahme als Zuhörerin oder Zuhörer nach Maßgabe
              der räumlichen Verhältnisse ermöglicht werden, sofern nicht eine Prüfungskandidatin
              oder ein Prüfungskandidat bei der Anmeldung zur Prüfung widerspricht. Die Zulassung
              erstreckt sich nicht auf die Beratung und Bekanntgabe des Prüfungsergebnisses.
            </p>
            {@render assessmentMethodMeta('oral-exam')}
          </div>

          <div id="home-assignment" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Hausarbeit</h3>
            <p>
              Eine Hausarbeit (z.B. Fallstudie, Recherche) dient der Feststellung, ob die
              Studierenden befähigt sind, innerhalb einer vorgegebenen Frist eine Fachaufgabe nach
              wissenschaftlichen und fachpraktischen Methoden selbstständig in schriftlicher oder
              elektronischer Form zu bearbeiten. Das Thema und der Umfang (z. B. Seitenzahl des
              Textteils) der Hausarbeit werden von der Prüferin beziehungsweise dem Prüfer zu Beginn
              des Semesters festgelegt. Eine Eigenständigkeitserklärung muss vom Prüfling
              unterzeichnet und abgegeben werden.
            </p>
            {@render assessmentMethodMeta('home-assignment')}
          </div>

          <div id="open-book-exam" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Open-Book-Ausarbeitung</h3>
            <p>
              Die Open-Book-Ausarbeitung ist eine Kurz-Hausarbeit und damit eine unbeaufsichtigte
              schriftliche oder elektronische Prüfung. Sie zeichnet sich dadurch aus, dass gemäß
              Hilfsmittelerklärung der Prüferin bzw. des Prüfers in der Regel alle Hilfsmittel
              zugelassen sind. Auf die Sicherung guter wissenschaftlicher Praxis durch
              ordnungsgemäßes Zitieren etc. und das Erfordernis der Eigenständigkeit der Erbringung
              jedweder Prüfungsleistung wird besonders hingewiesen.
            </p>
            {@render assessmentMethodMeta('open-book-exam')}
          </div>

          <div id="oral-contribution" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Mündlicher Beitrag</h3>
            <p>
              Ein mündlicher Beitrag (z. B. Referat, Präsentation, Verhandlung, Moderation) dient
              der Feststellung, ob die Studierenden befähigt sind, innerhalb einer vorgegebenen
              Frist eine praxisorientierte Aufgabe nach wissenschaftlichen und fachpraktischen
              Methoden selbstständig zu bearbeiten und mittels verbaler Kommunikation fachlich
              angemessen darzustellen. Die Dauer des mündlichen Beitrags wird von der Prüferin
              beziehungsweise dem Prüfer zu Beginn des Semesters festgelegt. Die für die Benotung
              des mündlichen Beitrags maßgeblichen Tatsachen sind in einem Protokoll festzuhalten.
              Die Note ist den Studierenden spätestens eine Woche nach dem mündlichen Beitrag
              bekanntzugeben.
            </p>
            {@render assessmentMethodMeta('oral-contribution')}
          </div>

          <div id="project" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Projektarbeit</h3>
            <p>
              Die Projektarbeit ist eine Prüfungsleistung, die in der selbstständigen Bearbeitung
              einer eng umrissenen, wissenschaftlichen Fragestellung unter Anleitung mit einer
              schriftlichen Dokumentation der Ergebnisse in Berichtsform besteht.
            </p>
            {@render assessmentMethodMeta('project')}
          </div>

          <div id="certificate-achievement" class="scroll-mt-24 space-y-3">
            <h3>§ 23 Weitere Prüfungsformen: Testat</h3>
            <p>
              Mit einem Testat/Zwischentestat wird bescheinigt, dass die oder der Studierende eine
              Studienarbeit (z.B. Entwurf) im geforderten Umfang erstellt hat. Der zu erbringende
              Leistungsumfang sowie die geforderten Inhalte und Anforderungen ergeben sich aus der
              jeweiligen Modulbeschreibung im Modulhandbuch sowie aus der Aufgabenstellung.
            </p>
            {@render assessmentMethodMeta('certificate-achievement')}
          </div>

          <div id="performance-assessment" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Performanzprüfung</h3>
            <p>
              Im Rahmen einer Performanzprüfung werden realitätsnahe, typische Handlungssituationen
              simuliert. Die Studierenden werden hierzu mit einer oder mehreren Aufgabenstellungen
              konfrontiert, wie sie in ihrem späteren Berufsfeld tatsächlich vorkommen (können). Die
              Studierenden müssen diese Aufgabenstellung – nach Maßgabe der konkreten Ausgestaltung
              in dem jeweiligen Modul – alleine oder in der Rolle eines Mitgliedes einer mit den
              jeweiligen Aufgaben betrauten Gruppe in eigener Verantwortung lösen. Wie sorgfältig
              die Aufgabenstellung analysiert und welcher Lösungsweg eingeschlagen wird, welche
              Methoden und Instrumente ausgewählt und eingesetzt werden und wie die Studierenden die
              eigenen Aktivitäten sowie die Zusammenarbeit mit den anderen Gruppenmitgliedern
              ausgestalten, organisieren, koordinieren und dokumentieren (Projektmanagement),
              bestimmen die Studierenden analog zur beruflichen Praxis weitgehend selbst; dies wird
              bewertet (Performanz).
            </p>
            {@render assessmentMethodMeta('performance-assessment')}
          </div>

          <div id="portfolio" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Lernportfolio</h3>
            <p>
              Ein Lernportfolio dokumentiert den studentischen Kompetenzentwicklungsprozess anhand
              von Präsentationen, Essays, Ausschnitten aus Praktikumsberichten,
              Inhaltsverzeichnissen von Hausarbeiten, Mitschriften, To-Do-Listen,
              Forschungsberichten und anderen Leistungsdarstellungen und Lernproduktionen,
              zusammengefasst als sogenannte „Artefakte“. Nur in Verbindung mit der studentischen
              Reflexion (schriftlich, mündlich oder auch in einem Video) der Verwendung dieser
              Artefakte für das Erreichen des zuvor durch die Prüferin oder den Prüfer transparent
              gemachten Lernziels wird das Lernportfolio zum Prüfungsgegenstand. Während der
              Erstellung des Lernportfolios wird von der Prüferin oder dem Prüfer im Semesterverlauf
              Feedback auf Entwicklungsschritte und/oder Artefakte gegeben. Als Prüfungsleistung
              wird eine nach dem Feedback überarbeitete Form des Lernportfolios – in
              handschriftlicher oder elektronischer Form – eingereicht.
            </p>
            {@render assessmentMethodMeta('portfolio')}
          </div>

          <div id="practical-report" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Praktikumsbericht</h3>
            <p>
              Ein Praktikumsbericht (z. B. Versuchsprotokoll) dient der Feststellung, ob die
              Studierenden befähigt sind, innerhalb einer vorgegebenen Frist eine laborpraktische
              Aufgabe selbstständig sowohl praktisch zu bearbeiten als auch Bearbeitungsprozess und
              Ergebnis schriftlich zu dokumentieren, zu bewerten und zu reflektieren.
              Praktikumsberichte können auch in Form einer Gruppenarbeit zur Prüfung zugelassen
              werden. Die Bewertung des Praktikumsberichts ist den Studierenden spätestens sechs
              Wochen nach Abgabe des Berichts bekanntzugeben.
            </p>
            {@render assessmentMethodMeta('practical-report')}
          </div>

          <div id="role-play" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Rollenspiel</h3>
            <p>
              Ein Rollenspiel (auch Planspiel) dient der Feststellung, ob die Studierenden befähigt
              sind, innerhalb einer vorgegebenen Zeitspanne in einer praxisnahen oder praxisanalogen
              Situation bzw. Simulation Aufgaben mit wissenschaftlichen Methoden und unter Einsatz
              von Kommunikations- und Kooperationstechniken in der Regel im Diskurs mit weiteren
              handelnden, realen oder virtuellen Personen zu lösen. Die Bewertung ist den
              Studierenden nach Abschluss des Rollenspiels bekanntzugeben.
            </p>
            {@render assessmentMethodMeta('role-play')}
          </div>

          <div id="admission-colloquium" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Zugangskolloquium</h3>
            <p>
              Ein Zugangskolloquium dient der Feststellung, ob die Studierenden die
              versuchsspezifischen Voraussetzungen erfüllen, eine definierte laborpraktische Aufgabe
              nach wissenschaftlichen und fachpraktischen Methoden selbständig und sicher bearbeiten
              zu können.
            </p>
            {@render assessmentMethodMeta('admission-colloquium')}
          </div>

          <div id="specimen" class="scroll-mt-24 space-y-3">
            <h3>§ 22 Weitere Prüfungsformen: Präparat</h3>
            <p>
              Ein Präparat ist das materielle Produkt einer Arbeitsleistung, das hinsichtlich seiner
              Qualität und Quantität zuvor festgelegten Kriterien genügt. Es dient der Feststellung,
              ob der Prüfling befähigt ist, innerhalb vorgegebener Fristen eine Aufgabe mit dem Ziel
              der Herstellung eines Produktes nach wissenschaftlichen und fachpraktischen Methoden
              selbständig zu bearbeiten. Die Bewertung für das Präparat ist dem Prüfling spätestens
              zwei Wochen nach dem Abgabetermin bekanntzugeben.
            </p>
            {@render assessmentMethodMeta('specimen')}
          </div>
        </section>
      </Tooltip.Provider>
    </main>

    <aside class="sticky top-6 hidden w-64 shrink-0 self-start lg:block">
      <div class="bg-card max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border p-4 shadow-sm">
        <nav class="space-y-1">
          <div class="border-border mb-4 border-b pb-3">
            <h3 class="text-foreground text-lg font-semibold">Inhaltsverzeichnis</h3>
          </div>

          {#each assessmentMethodLinks as method (method.id)}
            <button
              class="hover:bg-muted block w-full rounded-md px-3 py-1.5 text-left text-sm transition-all duration-200 {activeSelection ===
              method.id
                ? 'bg-primary/10 text-primary scale-[1.02] font-medium shadow-sm'
                : 'text-muted-foreground hover:text-foreground'}"
              onclick={() => scrollToSection(method.id)}
            >
              {method.title}
            </button>
          {/each}
        </nav>
      </div>
    </aside>
  </div>
</div>
