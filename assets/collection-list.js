/**
 * Custom module for collections list
 */
(function (Collections) {
  let scrollLoad = true;
  let currentEndpoint = "";
  let initialEndpoint = "";
  let collectionsArray = [];
  let collectionListElem;
  let renderRow;
  const MAX_RETRY_COUNT = 2;
  const filterTypeElem = $("#list-collections-filter-type");

  const SORTKEY_MAP = {
    new: { sortKey: "UPDATED_AT", reverse: true },
    old: { sortKey: "UPDATED_AT", reverse: false },
    title_asc: { sortKey: "TITLE", reverse: false },
    title_desc: { sortKey: "TITLE", reverse: true },
  };

  /**
   * Handle filter type change
   */
  filterTypeElem.on("change", function () {
    collectionListElem.empty();

    const newVal = $(this).val();
    const { sortKey, reverse } = SORTKEY_MAP[newVal];

    const url = new URL(initialEndpoint);
    url.searchParams.delete("after");
    url.searchParams.set("sortKey", sortKey);
    url.searchParams.set("reverse", reverse);
    currentEndpoint = url.toString();

    window.Collections.getCollections();
  });

  /**
   * Initialize collections loader
   * @param {{limit:number, sortKey: "UPDATED_AT" | "TITLE" | "ID", suffix:string, reverse: boolean, listElem:HTMLElement, perRow: string}} param0
   */
  Collections.load = ({ limit = 250, sortKey = "UPDATED_AT", suffix, reverse = true, listElem, perRow }) => {
    currentEndpoint = `${window.theme.api_url}/collections?limit=${limit}&sortKey=${sortKey}&suffix=${suffix}&reverse=${reverse}`;
    initialEndpoint = currentEndpoint;
    collectionListElem = $(listElem);
    renderRow = perRow;

    if (sortKey === "UPDATED_AT") filterTypeElem.val(reverse ? "new" : "old");
    else if (sortKey === "TITLE") filterTypeElem.val(reverse ? "title_desc" : "title_asc");
  };

  Collections.getCollections = async (retryCount = 0) => {
    if (!currentEndpoint || !collectionListElem) return;
    try {
      const response = await $.get(currentEndpoint, null, null, "json");
      const {
        collections,
        pagination: { hasNextPage, cursor },
      } = response;
      if (!hasNextPage || !cursor) currentEndpoint = "";
      else {
        const url = new URL(currentEndpoint);
        url.searchParams.set("after", cursor);
        currentEndpoint = url.toString();
      }

      collections.forEach((collection) => {
        collectionListElem.append(renderCollectionItem(collection));
        collectionsArray.push(collection);
      });

      if (collectionsArray.length < 5) {
        await window.Collections.getCollections();
      }
    } catch (e) {
      if (retryCount < MAX_RETRY_COUNT) {
        await sleep(1000);
        await window.Collections.getCollections(++retryCount);
      }
    }
  };

  const renderCollectionItem = (collection) => {
    return `
        <div class="grid__item grid__item--${renderRow}">
          <div class="collection-item">
            <a href="/collections/${collection.handle}" class="hover">
              <div class="image image--responsive ws-image">
                ${
                  collection.image
                    ? `<img
                    class="image__img ws-image__img lazyload"
                    data-src="${collection.image.transformedSrc}"
                    data-widths="[180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048]"
                    data-sizes="auto"
                    alt="${collection.image.altText}">`
                    : `<img
                    class="image__img ws-image__img lazyload"
                    data-src="https://site-files.fiftyflowers.com/FiftyFlowers/Image/Flowerpro/flpr_dl_default.jpg"
                    data-widths="[180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048]"
                    data-sizes="auto"
                    alt="placeholder"
                  >`
                }
              </div>
            </a>
            <div class="collection-item__footer ws-collection-item__footer">
              <h4 class="collection-item__header ff-heading fs-heading-small c-heading">
                <a href="/collections/${collection.handle}">${collection.title}</a>
              </h4>
            </div>
          </div>
        </div>
      `;
  };

  $(window).scroll(async function () {
    if (scrollLoad && $(window).scrollTop() >= $(document).height() - $(window).height() - 1300) {
      scrollLoad = false;
      await window.Collections.getCollections();
      scrollLoad = true;
    }
  });

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})((window.Collections = window.Collections || {}));
