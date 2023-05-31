import React, { Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';

import classNames from '@staticcms/core/lib/util/classNames.util';

import type { Breadcrumb } from '@staticcms/core/interface';
import type { FC } from 'react';

export interface BreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
}

const Breadcrumbs: FC<BreadcrumbsProps> = ({ breadcrumbs }) => {
  const finalNonEditorBreadcrumb = useMemo(() => {
    const nonEditorBreadcrumbs = breadcrumbs.filter(b => !b.editor);
    if (nonEditorBreadcrumbs.length === 0) {
      return undefined;
    }

    return nonEditorBreadcrumbs[nonEditorBreadcrumbs.length - 1];
  }, [breadcrumbs]);

  return (
    <div
      className="
        flex
        h-full
        w-breadcrumb-title-small
        md:w-auto
        items-center
        text-xl
        font-semibold
        gap-1
        text-gray-800
        dark:text-white
        flex-grow
      "
    >
      <div
        className="
          hidden
          md:flex
          overflow-hidden
          relative
          flex-grow
          h-full
        "
      >
        <div
          className="
            w-full
            absolute
            inset-0
            flex
            items-center
            gap-1
          "
        >
          {breadcrumbs.map((breadcrumb, index) =>
            breadcrumb.name ? (
              <Fragment key={`breadcrumb-${index}`}>
                {index > 0 ? <span key={`separator-${index}`}>&#62;</span> : null}
                {breadcrumb.to ? (
                  <Link
                    key={`link-${index}`}
                    className={classNames(
                      `
                        hover:text-gray-400
                        dark:hover:text-gray-400
                        overflow-hidden
                        whitespace-nowrap
                        focus:outline-none
                        focus:ring-4
                        focus:ring-gray-200
                        dark:focus:ring-slate-700
                      `,
                      index + 1 === breadcrumbs.length ? 'text-ellipsis' : 'flex-shrink-0',
                    )}
                    to={breadcrumb.to}
                  >
                    {breadcrumb.name}
                  </Link>
                ) : (
                  <span
                    key={`text-${index}`}
                    className={classNames(
                      `
                        overflow-hidden
                        whitespace-nowrap
                        text-ellipsis
                      `,
                      index + 1 === breadcrumbs.length ? 'text-ellipsis' : 'flex-shrink-0',
                    )}
                  >
                    {breadcrumb.name}
                  </span>
                )}
              </Fragment>
            ) : null,
          )}
        </div>
      </div>
      {finalNonEditorBreadcrumb ? (
        finalNonEditorBreadcrumb.to ? (
          <Link
            key="final-non-editor-breadcrumb-link"
            className="
              block
              md:hidden
              overflow-hidden
              whitespace-nowrap
              text-ellipsis
              w-full
              focus:outline-none
              focus:ring-4
              focus:ring-gray-200
              dark:focus:ring-slate-700
            "
            to={finalNonEditorBreadcrumb.to}
          >
            {finalNonEditorBreadcrumb.name}
          </Link>
        ) : (
          <div
            key="final-non-editor-breadcrumb-text"
            className="
              block
              md:hidden
              overflow-hidden
              whitespace-nowrap
              text-ellipsis
              w-full
            "
          >
            {finalNonEditorBreadcrumb?.name ?? ''}
          </div>
        )
      ) : null}
    </div>
  );
};

export default Breadcrumbs;
