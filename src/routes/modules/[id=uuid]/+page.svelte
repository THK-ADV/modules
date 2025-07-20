<script lang="ts">
  import type { PageProps } from './$types'
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Separator } from '$lib/components/ui/separator'
  import {
    BookOpen,
    Clock,
    Globe,
    Users,
    Calendar,
    Award,
    GraduationCap,
    Target,
    BookText,
    Lightbulb,
    CheckCircle,
    AlertCircle,
    Info,
    Building,
    User
  } from '@lucide/svelte'
  import type { ModuleDetail } from '$lib/types/module-details'

  let { data }: PageProps = $props()
  const module: ModuleDetail = data.module

  // Prefer 'lecturers' if present and non-empty, otherwise fallback to legacy 'lecturer'
  module.lecturers = (module.lecturers && module.lecturers.length > 0)
    ? module.lecturers
    : ((module as any)?.lecturer ?? [])
</script>

<div class="container mx-auto space-y-6 p-6">
  <!-- Header Section -->
  <div class="flex flex-col space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">{module.title}</h1>
        <div class="mt-2 flex items-center gap-2">
          <Badge variant="secondary" class="text-sm">
            <BookOpen class="mr-1 h-4 w-4" />
            {module.abbreviation}
          </Badge>
          <Badge variant="outline" class="text-sm">
            <Award class="mr-1 h-4 w-4" />
            {module.ects} ECTS
          </Badge>
          <Badge variant="outline" class="text-sm">
            <Globe class="mr-1 h-4 w-4" />
            {module.language}
          </Badge>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

    <!-- Grunddaten -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Info class="h-5 w-5" />
          Grunddaten
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Modulnummer</span>
          <span class="font-medium">{module.abbreviation}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Art des Moduls</span>
          <span class="font-medium">{module.moduleType}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">ECTS credits</span>
          <Badge variant="secondary">{module.ects}</Badge>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Sprache</span>
          <span class="font-medium">{module.language}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Dauer des Moduls</span>
          <div class="flex items-center gap-1">
            <Clock class="h-4 w-4" />
            <span class="font-medium">{module.duration} Semester</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Häufigkeit</span>
          <div class="flex items-center gap-1">
            <Calendar class="h-4 w-4" />
            <span class="font-medium">{module.season}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Verantwortliche -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Users class="h-5 w-5" />
          Verantwortliche
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div>
          <div class="mb-1 text-sm text-muted-foreground">Modulverantwortliche*r</div>
          {#each module.moduleManagement as manager}
            <div class="flex items-center gap-2">
              <User class="h-4 w-4" />
              <span class="font-medium">
                {#if manager.kind === 'person'}
                  {manager.title} {manager.firstname} {manager.lastname}
                {:else}
                  {manager.title}
                {/if}
              </span>
              {#if manager.kind === 'person'}
                {#each manager.faculties as faculty}
                  <Badge variant="outline" class="text-xs">{faculty.toUpperCase()}</Badge>
                {/each}
              {/if}
            </div>
          {/each}
        </div>

        <Separator />

        <div>
          <div class="mb-1 text-sm text-muted-foreground">Dozierende</div>
          {#each module.lecturers as lecturer}
            <div class="mb-1 flex items-center gap-2">
              <GraduationCap class="h-4 w-4" />
              <span class="font-medium">
                {#if lecturer.kind === 'person'}
                  {lecturer.title} {lecturer.firstname} {lecturer.lastname}
                {:else}
                  {lecturer.title}
                {/if}
              </span>
              {#if lecturer.kind === 'person'}
                {#each lecturer.faculties as faculty}
                  <Badge variant="outline" class="text-xs">{faculty.toUpperCase()}</Badge>
                {/each}
              {/if}
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>

    <!-- Prüfung & Workload -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <CheckCircle class="h-5 w-5" />
          Prüfung & Workload
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div>
          <div class="mb-1 text-sm text-muted-foreground">Prüfungsformen</div>
          <div class="flex flex-wrap gap-1">
            {#each module.assessments as assessment}
              <Badge variant="outline" class="text-xs">{assessment.label}</Badge>
            {/each}
          </div>
        </div>

        <Separator />

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Workload</span>
            <span class="font-medium">{module.ects * 30} h</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Präsenzzeit</span>
            <span class="font-medium"
              >{module.workload.lecture +
                module.workload.seminar +
                module.workload.practical +
                module.workload.exercise +
                module.workload.projectSupervision +
                module.workload.projectWork} h</span
            >
          </div>
          {#if module.workload.lecture > 0}
            <div class="flex items-center justify-between text-xs">
              <span class="ml-4 text-muted-foreground">Vorlesung</span>
              <span>{module.workload.lecture} h</span>
            </div>
          {/if}
          {#if module.workload.exercise > 0}
            <div class="flex items-center justify-between text-xs">
              <span class="ml-4 text-muted-foreground">Übung</span>
              <span>{module.workload.exercise} h</span>
            </div>
          {/if}
          {#if module.workload.seminar > 0}
            <div class="flex items-center justify-between text-xs">
              <span class="ml-4 text-muted-foreground">Seminar</span>
              <span>{module.workload.seminar} h</span>
            </div>
          {/if}
          {#if module.workload.practical > 0}
            <div class="flex items-center justify-between text-xs">
              <span class="ml-4 text-muted-foreground">Praktikum</span>
              <span>{module.workload.practical} h</span>
            </div>
          {/if}
          {#if module.workload.projectSupervision > 0}
            <div class="flex items-center justify-between text-xs">
              <span class="ml-4 text-muted-foreground">Projektbetreuung</span>
              <span>{module.workload.projectSupervision} h</span>
            </div>
          {/if}
          {#if module.workload.projectWork > 0}
            <div class="flex items-center justify-between text-xs">
              <span class="ml-4 text-muted-foreground">Projektarbeit</span>
              <span>{module.workload.projectWork} h</span>
            </div>
          {/if}
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Selbststudium</span>
            <span class="font-medium">
              {module.ects * 30 -
                (module.workload.lecture +
                  module.workload.seminar +
                  module.workload.practical +
                  module.workload.exercise +
                  module.workload.projectSupervision +
                  module.workload.projectWork)} h
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Voraussetzungen -->
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="flex items-center gap-2 text-lg">
        <AlertCircle class="h-5 w-5" />
        Voraussetzungen
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div>
        <div class="mb-2 flex items-center gap-2">
          <AlertCircle class="h-4 w-4 text-red-500" />
          <span class="text-sm font-medium">Zwingende Voraussetzungen</span>
        </div>
        {#if module.requiredPrerequisites}
          <div class="pl-6 flex flex-wrap gap-2 mb-2">
            {#each module.requiredPrerequisites.modules as requiredModule}
              <Badge variant="outline" class="text-xs">{requiredModule.title}</Badge>
            {/each}
          </div>
          <p class="pl-6 text-sm text-muted-foreground">{module.requiredPrerequisites.text}</p>
        {:else}
          <p class="pl-6 text-sm text-muted-foreground">Keine</p>
        {/if}
      </div>

      <div>
        <div class="mb-2 flex items-center gap-2">
          <Lightbulb class="h-4 w-4 text-yellow-500" />
          <span class="text-sm font-medium">Empfohlene Voraussetzungen</span>
        </div>
        {#if module.recommendedPrerequisites}
          <div class="pl-6 flex flex-wrap gap-2 mb-2">
            {#each module.recommendedPrerequisites.modules as recommendedModule}
              <Badge variant="outline" class="text-xs">{recommendedModule.title}</Badge>
            {/each}
          </div>
          <p class="pl-6 text-sm text-muted-foreground">{module.recommendedPrerequisites.text}</p>
        {:else}
          <p class="pl-6 text-sm text-muted-foreground">Keine</p>
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Verwendung -->
  {#if module.poMandatory.length > 0}
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Building class="h-5 w-5" />
          Verwendung des Moduls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          {#each module.poMandatory as po}
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-muted/50 p-2 gap-2">
              <div>
                <span class="font-medium">{po.degree}: {po.studyProgramLabel}</span>
                <Badge variant="secondary" class="ml-2 text-xs">PO {po.poVersion}</Badge>
                {#if po.specialization}
                  <Badge variant="outline" class="ml-2 text-xs">{po.specialization}</Badge>
                {/if}
              </div>
              {#if po.recommendedSemester.length > 0}
                <div class="text-sm text-muted-foreground">
                  Semester {po.recommendedSemester.join(', ')}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Lernergebnisse -->
  {#if module.content.learningOutcome}
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Target class="h-5 w-5" />
          Angestrebte Lernergebnisse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="whitespace-pre-wrap">
          {@html module.content.learningOutcome}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Modulinhalte -->
  {#if module.content.moduleContent}
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <BookText class="h-5 w-5" />
          Modulinhalte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="whitespace-pre-wrap">
          {@html module.content.moduleContent}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Lehr- und Lernmethoden -->
  {#if module.content.learningMethods}
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Lightbulb class="h-5 w-5" />
          Lehr- und Lernmethoden
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="whitespace-pre-wrap">
          {@html module.content.learningMethods}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Literatur -->
  {#if module.content.literature}
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <BookOpen class="h-5 w-5" />
          Empfohlene Literatur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="text-sm space-y-0 list-disc list-inside">
          {#each module.content.literature.split('\n').filter(line => line.trim()) as line}
            <li>{@html line.replace(/^\*\s*/, '')}</li>
          {/each}
        </ul>
      </CardContent>
    </Card>
  {/if}

  <!-- Besonderheiten -->
  {#if module.content.particularities}
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Info class="h-5 w-5" />
          Besonderheiten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="prose prose-sm max-w-none">
          {@html module.content.particularities}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Meta Information -->
  <Card class="border-dashed">
    <CardContent class="pt-6">
      <div class="flex items-start justify-start text-xs text-muted-foreground">
        <span>Letzte Aktualisierung: {new Date(module.lastModified).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
      </div>
    </CardContent>
  </Card>
</div>
