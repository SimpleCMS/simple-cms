import type { LocalePhrasesRoot } from '../types';

const nn_no: LocalePhrasesRoot = {
  auth: {
    login: 'Logg inn',
    loggingIn: 'Loggar inn..',
    loginWithNetlifyIdentity: 'Logg på med Netlify Identity',
    loginWithBitbucket: 'Logg på med Bitbucket',
    loginWithGitHub: 'Logg på med GitHub',
    loginWithGitLab: 'Logg på med GitLab',
    loginWithGitea: 'Logg på med Gitea',
    errors: {
      email: 'Du må skriva inn e-posten din.',
      password: 'Du må skriva inn passordet ditt.',
      authTitle: undefined, // English translation: 'Error logging in'
      authBody: '%{details}',
      netlifyIdentityNotFound: undefined, // English translation: 'Netlify Identity plugin not found'
      identitySettings:
        'Fann ingen innstillingar for Identity. Om du ynskjer å nytte git-gateway må du hugse å skru på Identity service og Git Gateway',
    },
  },
  app: {
    header: {
      content: 'Innhald',
      workflow: 'Arbeidsflyt',
      media: 'Media',
      quickAdd: 'Hurtiginnlegg',
    },
    app: {
      loading: 'Lastar...',
      errorHeader: 'Noko gjekk gale under lastinga av CMS konfigurasjonen',
      configErrors: 'Konfigurasjonsfeil',
      configNotFound: undefined, // English translation: 'Config not found'
      checkConfigYml: 'Sjå over config.yml fila.',
      loadingConfig: 'Lastar konfigurasjon...',
      waitingBackend: 'Ventar på backend...',
    },
    notFoundPage: {
      header: 'Ikkje funnen',
    },
  },
  collection: {
    sidebar: {
      collections: 'Samlingar',
      allCollections: undefined, // English translation: 'All Collections'
      searchAll: 'Søk i alle',
      searchIn: undefined, // English translation: 'Search in'
    },
    collectionTop: {
      sortBy: 'Sorter etter',
      viewAs: 'Vis som',
      newButton: 'Ny %{collectionLabel}',
      ascending: 'Stigande',
      descending: 'Synkande',
      searchResults: undefined, // English translation: 'Search Results for "%{searchTerm}"'
      searchResultsInCollection: undefined, // English translation: 'Search Results for "%{searchTerm}" in %{collection}'
      filterBy: undefined, // English translation: 'Filter by'
      groupBy: undefined, // English translation: 'Group by'
    },
    entries: {
      loadingEntries: 'Laster innlegg...',
      cachingEntries: 'Mellomlagrar innlegg...',
      longerLoading: 'Dette kan ta fleire minutt',
      noEntries: 'Ingen innlegg',
    },
    groups: {
      other: undefined, // English translation: 'Other'
      negateLabel: undefined, // English translation: 'Not %{label}'
    },
    table: {
      summary: undefined, // English translation: 'Summary'
      collection: undefined, // English translation: 'Collection'
    },
    defaultFields: {
      author: {
        label: 'Forfatter',
      },
      updatedOn: {
        label: 'Oppdatert',
      },
    },
    notFound: undefined, // English translation: 'Collection not found'
  },
  editor: {
    editorControl: {
      field: {
        optional: 'valfritt',
      },
    },
    editorControlPane: {
      widget: {
        required: '%{fieldLabel} krevast.',
        regexPattern: '%{fieldLabel} samsvarar ikkje med mønsteret: %{pattern}.',
        processing: '%{fieldLabel} vart prosessert.',
        range: '%{fieldLabel} må vera mellom %{minValue} og %{maxValue}.',
        min: '%{fieldLabel} må minst vera %{minValue}.',
        max: '%{fieldLabel} må vera %{maxValue} eller mindre.',
        rangeCount: '%{fieldLabel} må ha mellom %{minCount} og %{maxCount} element.',
        rangeCountExact: '%{fieldLabel} må ha nøyaktig %{count} element.',
        rangeMin: '%{fieldLabel} må minst ha %{minCount} element.',
        rangeMax: '%{fieldLabel} må ha %{maxCount} eller færre element.',
        invalidPath: undefined, // English translation: ''%{path}' is not a valid path.'
        pathExists: undefined, // English translation: 'Path '%{path}' already exists.'
        invalidColor: undefined, // English translation: 'Color '%{color}' is invalid.'
        invalidHexCode: undefined, // English translation: 'Hex codes must start with a # sign.'
      },
      i18n: {
        writingInLocale: undefined, // English translation: 'Writing in %{locale}'
        copyFromLocale: undefined, // English translation: 'Fill in from another locale'
        copyFromLocaleConfirm: undefined, // English translation: 'Do you want to fill in data from %{locale} locale?\nAll existing content will be overwritten.'
      },
    },
    editor: {
      onLeavePage: 'Er du sikker på at du vil navigere bort frå denne sida?',
      onUpdatingWithUnsavedChangesTitle: undefined, // English translation: 'Unsaved changes'
      onUpdatingWithUnsavedChangesBody: 'Du må lagra endringane dine før du endrar status',
      onPublishingNotReadyTitle: undefined, // English translation: 'Not ready to publish'
      onPublishingNotReadyBody: 'Du må endre status til "Klar" før du publiserer',
      onPublishingWithUnsavedChangesTitle: undefined, // English translation: 'Unsaved changes'
      onPublishingWithUnsavedChangesBody: 'Du må laga endringane dine før du kan publisere.',
      onPublishingTitle: undefined, // English translation: 'Publish entry?'
      onPublishingBody: 'Er du sikker på at vil publisere?',
      onUnpublishingTitle: undefined, // English translation: 'Unpublish entry?'
      onUnpublishingBody: 'Er du sikker på at du vil avpublisere innlegget?',
      onDeleteWithUnsavedChangesTitle: undefined, // English translation: 'Delete this published entry?'
      onDeleteWithUnsavedChangesBody:
        'Er du sikkert på at du vil slette eit publisert innlegg med tilhøyrande ulagra endringar?',
      onDeletePublishedEntryTitle: undefined, // English translation: 'Delete this published entry?'
      onDeletePublishedEntryBody: 'Er du sikker på at du vil slette dette publiserte innlegget?',
      onDeleteUnpublishedChangesWithUnsavedChangesTitle: undefined, // English translation: 'Delete unpublished changes?'
      onDeleteUnpublishedChangesWithUnsavedChangesBody:
        'Handlinga slettar endringar som ikkje er publisert eller lagra. Vil du halde fram?',
      onDeleteUnpublishedChangesTitle: undefined, // English translation: 'Delete unpublished changes?'
      onDeleteUnpublishedChangesBody:
        'Alle endringar som ikkje er publisert vil gå tapt. Vil du halde fram?',
      loadingEntry: 'Lastar innlegg...',
    },
    editorInterface: {
      sideBySideI18n: undefined, // English translation: 'I18n Side by Side'
      preview: undefined, // English translation: 'Preview'
      toggleI18n: undefined, // English translation: 'Toggle i18n'
      togglePreview: undefined, // English translation: 'Toggle preview'
      toggleScrollSync: undefined, // English translation: 'Sync scrolling'
    },
    editorToolbar: {
      publishing: 'Publiserer...',
      publish: 'Publiser',
      published: 'Publisert',
      unpublish: 'Avpubliser',
      duplicate: 'Dupliser',
      unpublishing: 'Avpubliserer...',
      publishAndCreateNew: 'Publiser og lag nytt',
      publishAndDuplicate: 'Publiser og dupliser',
      deleteUnpublishedChanges: 'Slett upubliserte endringar',
      deleteUnpublishedEntry: 'Slett upublisert innlegg',
      deletePublishedEntry: 'Slett publisert innlegg',
      deleteEntry: 'Slettar innlegg',
      saving: 'Lagrar...',
      save: 'Lagre',
      statusInfoTooltipDraft: undefined, // English translation: 'Entry status is set to draft. To finalize and submit it for review, set the status to �In review�'
      statusInfoTooltipInReview: undefined, // English translation: 'Entry is being reviewed, no further actions are required. However, you can still make additional changes while it is being reviewed.'
      deleting: 'Slettar...',
      updating: 'Oppdaterer...',
      status: 'Status: %{status}',
      backCollection: ' Skriv i samlinga %{collectionLabel}',
      unsavedChanges: 'Ulagra endringar',
      changesSaved: 'Endringar lagret',
      draft: 'Kladd',
      inReview: 'Til godkjenning',
      ready: 'Klar',
      publishNow: 'Publiser no',
      deployPreviewPendingButtonLabel: 'Kontroller førehandsvisning',
      deployPreviewButtonLabel: 'Sjå førehandsvisning',
      deployButtonLabel: 'Sjå i produksjon',
      discardChanges: undefined, // English translation: 'Discard changes'
      discardChangesTitle: undefined, // English translation: 'Discard changes'
      discardChangesBody: undefined, // English translation: 'Are you sure you want to discard the unsaved changed?'
    },
    editorWidgets: {
      markdown: {
        bold: undefined, // English translation: 'Bold'
        italic: undefined, // English translation: 'Italic'
        strikethrough: undefined, // English translation: 'Strikethrough'
        code: undefined, // English translation: 'Code'
        codeBlock: undefined, // English translation: 'Code block'
        insertCodeBlock: undefined, // English translation: 'Insert code block'
        link: undefined, // English translation: 'Link'
        insertLink: undefined, // English translation: 'Insert link'
        paragraph: undefined, // English translation: 'Paragraph'
        headings: undefined, // English translation: 'Headings'
        quote: undefined, // English translation: 'Quote'
        insertQuote: undefined, // English translation: 'Insert blockquote'
        bulletedList: undefined, // English translation: 'Bulleted List'
        numberedList: undefined, // English translation: 'Numbered List'
        addComponent: undefined, // English translation: 'Add Component'
        richText: 'Rik-tekst',
        markdown: 'Markdown',
        type: undefined, // English translation: 'Type...'
        decreaseIndent: undefined, // English translation: 'Decrease indent'
        increaseIndent: undefined, // English translation: 'Increase indent'
        image: undefined, // English translation: 'Image'
        insertImage: undefined, // English translation: 'Insert image'
        table: {
          table: undefined, // English translation: 'Table'
          deleteColumn: undefined, // English translation: 'Delete column'
          deleteRow: undefined, // English translation: 'Delete row'
          deleteTable: undefined, // English translation: 'Delete table'
          insertColumn: undefined, // English translation: 'Insert column'
          insertRow: undefined, // English translation: 'Insert row'
          insertTable: undefined, // English translation: 'Insert table'
        },
      },
      image: {
        choose: 'Vel bilete',
        chooseMultiple: undefined, // English translation: 'Choose images'
        chooseUrl: undefined, // English translation: 'Insert from URL'
        replaceUrl: undefined, // English translation: 'Replace with URL'
        promptUrl: undefined, // English translation: 'Enter the URL of the image'
        chooseDifferent: 'Vel eit anna bilete',
        addMore: undefined, // English translation: 'Add more images'
        remove: 'Fjern bilete',
        removeAll: undefined, // English translation: 'Remove all images'
      },
      file: {
        choose: 'Vel fil',
        chooseUrl: undefined, // English translation: 'Insert from URL'
        chooseMultiple: undefined, // English translation: 'Choose files'
        replaceUrl: undefined, // English translation: 'Replace with URL'
        promptUrl: undefined, // English translation: 'Enter the URL of the file'
        chooseDifferent: 'Vel ei anna fil',
        addMore: undefined, // English translation: 'Add more files'
        remove: 'Fjern fil',
        removeAll: undefined, // English translation: 'Remove all files'
      },
      folder: {
        choose: undefined, // English translation: 'Choose a folder'
        chooseUrl: undefined, // English translation: 'Insert folder path'
        chooseMultiple: undefined, // English translation: 'Choose folders'
        replaceUrl: undefined, // English translation: 'Replace with path'
        promptUrl: undefined, // English translation: 'Enter path of the folder'
        chooseDifferent: undefined, // English translation: 'Choose different folder'
        addMore: undefined, // English translation: 'Add more folders'
        remove: undefined, // English translation: 'Remove folder'
        removeAll: undefined, // English translation: 'Remove all folders'
      },
      unknownControl: {
        noControl: "Ingen konfigurasjon for widget '%{widget}'.",
      },
      unknownPreview: {
        noPreview: "Ingen førehandsvisning tilgjengeleg for '%{widget}'.",
      },
      headingOptions: {
        headingOne: 'Overskrift 1',
        headingTwo: 'Overskrift 2',
        headingThree: 'Overskrift 3',
        headingFour: 'Overskrift 4',
        headingFive: 'Overskrift 5',
        headingSix: 'Overskrift 6',
      },
      datetime: {
        now: 'No',
        invalidDateTitle: undefined, // English translation: 'Invalid date'
        invalidDateBody: undefined, // English translation: 'The date you entered is invalid.'
      },
      list: {
        add: undefined, // English translation: 'Add %{item}'
        addType: undefined, // English translation: 'Add %{item}'
        noValue: undefined, // English translation: 'No value'
      },
      keyvalue: {
        key: undefined, // English translation: 'Key'
        value: undefined, // English translation: 'Value'
        uniqueKeys: undefined, // English translation: '%{keyLabel} must be unique'
      },
      code: {
        language: undefined, // English translation: 'Language'
        selectLanguage: undefined, // English translation: 'Select language'
      },
    },
  },
  mediaLibrary: {
    mediaLibraryCard: {
      draft: 'Kladd',
      copy: undefined, // English translation: 'Copy'
      copyUrl: undefined, // English translation: 'Copy URL'
      copyPath: undefined, // English translation: 'Copy Path'
      copyName: undefined, // English translation: 'Copy Name'
      copied: undefined, // English translation: 'Copied'
    },
    mediaLibrary: {
      onDeleteTitle: undefined, // English translation: 'Delete selected media?'
      onDeleteBody: 'Er du sikker på at du vil slette markert element?',
      fileTooLargeTitle: undefined, // English translation: 'File too large'
      fileTooLargeBody: 'Fila er for stor.\nMaksimal konfiguert filstorleik er %{size} kB.',
      alreadyExistsTitle: undefined, // English translation: 'File already exists'
      alreadyExistsBody: undefined, // English translation: '%{filename} already exists. Do you want to replace it?'
    },
    mediaLibraryModal: {
      noResults: 'Ingen resultat.',
      noAssetsFound: 'Ingen elementer funne.',
      noImagesFound: 'Ingen bilete funne.',
      private: 'Privat ',
      images: 'Bileter',
      mediaAssets: 'Mediebibliotek',
      search: 'Søk...',
      uploading: 'Lastar opp...',
      upload: 'Last opp',
      download: 'Last ned',
      deleting: 'Slettar...',
      deleteSelected: 'Slett markert',
      chooseSelected: 'Vel markert',
      dropImages: undefined, // English translation: 'Drop images to upload'
      dropFiles: undefined, // English translation: 'Drop files to upload'
    },
    folderSupport: {
      newFolder: undefined, // English translation: 'New folder'
      createNewFolder: undefined, // English translation: 'Create new folder'
      enterFolderName: undefined, // English translation: 'Enter folder name...'
      create: undefined, // English translation: 'Create'
      home: undefined, // English translation: 'Home'
      up: undefined, // English translation: 'Up'
      upToFolder: undefined, // English translation: 'Up to %{folder}'
    },
  },
  ui: {
    common: {
      yes: undefined, // English translation: 'Yes'
      no: undefined, // English translation: 'No'
      okay: undefined, // English translation: 'OK'
      cancel: undefined, // English translation: 'Cancel'
    },
    default: {
      goBackToSite: 'Attende til sida',
    },
    localBackup: {
      hasLocalBackup: undefined, // English translation: 'Has local backup'
    },
    errorBoundary: {
      title: 'Feil',
      details: 'Ein feil har oppstått. Det er fint om du ',
      reportIt: 'opnar eit issue på GitHub.',
      detailsHeading: 'Detaljer',
      privacyWarning:
        'Når du opnar eit issue vart feil og feilsøkingsdata automatisk fylt ut. Hugs å sjå over at alt ser greitt ut, og ikkje inneheld sensitive data.',
      recoveredEntry: {
        heading: 'Gjenopprettet dokument',
        warning: 'Det kan vere lurt å ta kopi av innhaldet før du navigerer bort frå denne sida!',
        copyButtonLabel: 'Kopier til utklippstavle',
      },
    },
    settingsDropdown: {
      theme: undefined, // English translation: 'Theme'
      logOut: 'Logg ut',
    },
    toast: {
      onFailToLoadEntries: 'Kunne ikkje laste innlegg: %{details}',
      onFailToLoadDeployPreview: 'Kunne ikkje laste førehandsvisning: %{details}',
      onFailToPersist: 'Kunne ikkje lagre: %{details}',
      onFailToPersistMedia: undefined, // English translation: 'Failed to persist media: %{details}'
      onFailToDelete: 'Kunne ikkje slette: %{details}',
      onFailToDeleteMedia: undefined, // English translation: 'Failed to delete media: %{details}'
      onFailToUpdateStatus: 'Kunne ikkje laste opp: %{details}',
      missingRequiredField:
        'Oisann, gløymte du noko? Alle påkrevde felt må fyllast ut før du kan halde fram',
      entrySaved: 'Innlegg lagra',
      entryDeleted: undefined, // English translation: 'Entry delete'
      entryPublished: 'Innlegg publisert',
      entryUnpublished: 'Innlegg avpublisert',
      onFailToPublishEntry: 'Kunne ikkje publisere: %{details}',
      onFailToUnpublishEntry: 'Kunne ikkje avpublisere: %{details}',
      entryUpdated: 'Innleggsstatus oppdatert',
      onDeletePublishedEntry: undefined, // English translation: 'Published entry deleted'
      onDeleteUnpublishedChanges: 'Avpubliserte endringar sletta',
      onFailToAuth: '%{details}',
      onLoggedOut: undefined, // English translation: 'You have been logged out, please back up any data and login again'
      onBackendDown: undefined, // English translation: 'The backend service is experiencing an outage. See %{details} for more information'
    },
  },
  workflow: {
    workflow: {
      loading: 'Lastar innlegg for redaksjonell arbeidsflyt',
      workflowHeading: 'Redaksjonell arbeidsflyt',
      newPost: 'Nytt innlegg',
      description:
        '%{smart_count} innlegg treng gjennomgong, og %{readyCount} er klar til publisering. |||| %{smart_count} innlegg treng gjennomgong, og %{readyCount} er klar til publisering ',
      dateFormat: 'MMMM D',
    },
    workflowCard: {
      lastChange: '%{date} av %{author}',
      lastChangeNoAuthor: '%{date}',
      lastChangeNoDate: 'av %{author}',
      deleteChanges: 'Slett endringar',
      deleteNewEntry: 'Slett nytt innlegg',
      publishChanges: 'Publiser endringar',
      publishNewEntry: 'Publiser nytt innlegg',
    },
    workflowList: {
      onDeleteEntry: 'Er du sikker på du vil slette innlegget?',
      onPublishingNotReadyEntry:
        'Du kan berre publisere innlegg i "Klar" kolonna. Dra kortet til riktig stad for å halde fram.',
      onPublishEntry: 'Er du sikker på du vil publisere innlegget?',
      draft: 'Kladd',
      pending_review: 'Gjennomgås',
      pending_publish: 'Klar',
      currentEntries: '%{smart_count} innlegg |||| %{smart_count} innlegg',
    },
  },
};

export default nn_no;
