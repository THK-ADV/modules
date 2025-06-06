import { z } from 'zod'

// TODO update to zod v4 (https://zod.dev/v4/changelog)

const yamlSafeText = z
  .string()
  .refine(
    (text) => {
      if (text === '') return true // empty strings are allowed

      // check for YAML special characters that are forbidden in scalar values
      const forbiddenChars = [
        "'", // single quotes
        '"', // double quotes
        ':', // colons (key-value separator)
        '\n', // newlines
        '\r', // carriage returns
        '\t', // tab characters
        '#', // hash/pound (comments)
        '&', // ampersand (anchors)
        '*', // asterisk (aliases)
        '[',
        ']', // square brackets (flow sequences)
        '{',
        '}', // curly braces (flow mappings)
        '|', // pipe (literal block scalars)
        '>', // greater than (folded block scalars)
        '!', // exclamation mark (tags)
        '%', // percent (directives)
        '@', // at symbol (reserved)
        '`' // backtick (reserved)
      ]

      return !forbiddenChars.some((char) => text.includes(char))
    },
    {
      message:
        'Text enthält nicht erlaubte Zeichen: Anführungszeichen (\' "), Doppelpunkte (:), Zeilenumbrüche, Tabs, Raute (#), Und-Zeichen (&), Sterne (*), eckige Klammern ([]), geschweifte Klammern ({}), senkrechte Striche (|), Größer-Zeichen (>), Ausrufezeichen (!), Prozentzeichen (%), At-Zeichen (@) und Backticks (`)'
    }
  )
  .refine(
    (text) => {
      if (text === '') return true
      // check for leading/trailing spaces which can be problematic in YAML
      return text === text.trim()
    },
    {
      message: 'Text darf nicht mit Leerzeichen beginnen oder enden'
    }
  )

export const moduleSchema = z
  .object({
    title: z
      .string()
      .nonempty('Modulbezeichnung erforderlich')
      .max(100, 'Modulbezeichnung muss weniger als 100 Zeichen lang sein'),
    abbrev: z
      .string()
      .nonempty('Modulabkürzung erforderlich')
      .max(20, 'Modulabkürzung muss weniger als 20 Zeichen lang sein'),
    moduleType: z.string().nonempty('Modulart erforderlich'),
    ects: z
      .number({ message: 'ECTS credits erforderlich' })
      .positive('ECTS credits müssen positiv sein')
      .max(100, 'ECTS credits dürfen nicht mehr als 100 sein')
      .multipleOf(0.1, 'ECTS credits dürfen nur eine Dezimalstelle haben'),
    language: z.string().nonempty('Sprache erforderlich'),
    duration: z
      .number({ message: 'Moduldauer erforderlich' })
      .positive('Moduldauer muss positiv sein')
      .max(10, 'Moduldauer darf nicht mehr als 10 sein'),
    season: z.string().nonempty('Häufigkeit des Angebots erforderlich'),
    location: z.string().nonempty('Standort erforderlich'),
    status: z.string().nonempty('Status erforderlich'),
    management: z.array(z.string()).min(1, 'Modulverantwortung erforderlich'),
    lecturers: z.array(z.string()).min(1, 'Dozierende erforderlich'),
    updatePermissions: z.array(z.string()),
    firstExaminer: z.string().nonempty('Erstprüfer erforderlich'),
    secondExaminer: z.string().nonempty('Zweitprüfer erforderlich'),
    examPhases: z.array(z.string()).min(1, 'Prüfungsphase erforderlich'),
    assessmentMethods: z
      .array(
        z.object({
          method: z.string().nonempty('Prüfungsform erforderlich'),
          percentage: z
            .number()
            .min(1, { message: 'Prozentsatz muss größer als 0 sein' })
            .max(100, { message: 'Prozentsatz muss kleiner als 100 sein' })
            .nullable(),
          precondition: z.array(z.string())
        })
      )
      .min(1, 'Keine Prüfungsform angegeben'),
    workload: z.object({
      lecture: z
        .number({ message: 'Eintrag erforderlich' })
        .int('Muss eine ganze Zahl sein')
        .min(0, 'Muss mindestens 0 sein'),
      seminar: z
        .number({ message: 'Eintrag erforderlich' })
        .int('Muss eine ganze Zahl sein')
        .min(0, 'Muss mindestens 0 sein'),
      exercise: z
        .number({ message: 'Eintrag erforderlich' })
        .int('Muss eine ganze Zahl sein')
        .min(0, 'Muss mindestens 0 sein'),
      practical: z
        .number({ message: 'Eintrag erforderlich' })
        .int('Muss eine ganze Zahl sein')
        .min(0, 'Muss mindestens 0 sein'),
      projectSupervision: z
        .number({ message: 'Eintrag erforderlich' })
        .int('Muss eine ganze Zahl sein')
        .min(0, 'Muss mindestens 0 sein'),
      projectWork: z
        .number({ message: 'Eintrag erforderlich' })
        .int('Muss eine ganze Zahl sein')
        .min(0, 'Muss mindestens 0 sein')
    }),
    recommendedPrerequisites: z
      .object({
        text: yamlSafeText,
        modules: z.array(z.string())
      })
      .nullable(),
    requiredPrerequisites: z
      .object({
        text: yamlSafeText,
        modules: z.array(z.string())
      })
      .nullable()
  })
  .refine(
    (data) => {
      const totalWorkload =
        data.workload.lecture +
        data.workload.seminar +
        data.workload.exercise +
        data.workload.practical +
        data.workload.projectSupervision +
        data.workload.projectWork
      const allowedHours = data.ects * 30
      return totalWorkload <= allowedHours
    },
    {
      message: 'Der gesamte Workload darf die ECTS-Credits nicht überschreiten',
      path: ['workload']
    }
  )

export type ModuleForm = z.infer<typeof moduleSchema>
