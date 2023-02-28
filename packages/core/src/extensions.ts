import {
  GitGatewayBackend,
  GitHubBackend,
  GitLabBackend,
  GiteaBackend,
  BitbucketBackend,
  TestBackend,
  ProxyBackend,
} from './backends';
import { registerBackend, registerLocale, registerWidget } from './lib/registry';
import locales from './locales';
import {
  BooleanWidget,
  // CodeWidget,
  //   ColorStringWidget,
  DateTimeWidget,
  FileWidget,
  ImageWidget,
  ListWidget,
  //   MapWidget,
  //   MarkdownWidget,
  NumberWidget,
  ObjectWidget,
  RelationWidget,
  SelectWidget,
  StringWidget,
  TextWidget,
} from './widgets';

export default function addExtensions() {
  // Register all the things
  registerBackend('git-gateway', GitGatewayBackend);
  registerBackend('github', GitHubBackend);
  registerBackend('gitlab', GitLabBackend);
  registerBackend('gitea', GiteaBackend);
  registerBackend('bitbucket', BitbucketBackend);
  registerBackend('test-repo', TestBackend);
  registerBackend('proxy', ProxyBackend);

  registerWidget([
    BooleanWidget(),
    // CodeWidget(),
    //   ColorStringWidget(),
    DateTimeWidget(),
    FileWidget(),
    ImageWidget(),
    ListWidget(),
    //   MapWidget(),
    //   MarkdownWidget(),
    NumberWidget(),
    ObjectWidget(),
    RelationWidget(),
    SelectWidget(),
    StringWidget(),
    TextWidget(),
  ]);

  Object.keys(locales).forEach(locale => {
    registerLocale(locale, locales[locale]);
  });
}
